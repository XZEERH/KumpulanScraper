#!/usr/bin/env node
'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const axios = require('axios');
const cheerio = require('cheerio');

/* ==========================================================================
 * 1. CONFIGURATION
 * ========================================================================== */

const CONFIG = {
  provider: 'removebackgrounds.ai',
  siteUrl: 'https://removebackgrounds.ai/',
  apiUrl: 'https://api.removebackgrounds.ai',
  modelHost: 'https://models.removebackgrounds.ai',

  // u2net    = full model, best quality  (~176 MB)
  // u2netp   = lite model, fast           (~4.5 MB)
  models: {
    full: { file: 'u2net.onnx', label: 'u2net', approxBytes: 175997641 },
    lite: { file: 'u2netp.onnx', label: 'u2netp', approxBytes: 4574861 },
  },

  modelSize: 320,           // U2-Net input resolution
  maxInputBytes: 26214400,  // 25 MB, same limit the website enforces
  defaultTimeout: 60000,
  connectTimeout: 15000,
  retries: 3,

  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',

  // Formats accepted by the website (extracted from the live front-end
  // bundle /_astro/upload-formats.iwi_DdOW.js).
  acceptedMime: [
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'image/heic', 'image/heif', 'image/avif', 'image/bmp', 'image/tiff',
  ],
  acceptedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.heif', '.avif', '.bmp', '.tif', '.tiff'],

  // ImageNet normalisation used by U2-Net (rembg convention).
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],

  cacheDir:
    process.env.REMOVEBG_CACHE_DIR ||
    path.join(os.homedir() || '.', '.cache', 'removebg-scraper'),
};

const VERSION = '1.0.0';

/* ==========================================================================
 * 2. UTILITIES
 * ========================================================================== */

class ScrapeError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'ScrapeError';
    this.code = code || 'SCRAPE_ERROR';
    this.details = details || null;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function sha256hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/** Retries an async operation with exponential backoff. */
async function withRetry(fn, { attempts = CONFIG.retries, delay = 500, factor = 2 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn(i);
    } catch (err) {
      lastErr = err;
      if (i >= attempts) break;
      await sleep(delay * Math.pow(factor, i - 1));
    }
  }
  throw lastErr;
}

/** Sniffs the real MIME type from the magic bytes (never trusts the file name). */
function sniffMime(buf) {
  if (!buf || buf.length < 12) return null;
  const b = buf;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
  if (b[0] === 0x42 && b[1] === 0x4d) return 'image/bmp';
  if (b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) return 'image/tiff';
  if (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a) return 'image/tiff';
  if (b[0] === 0x00 && b[1] === 0x00 && b[1] === 0x01 && b[2] === 0x00) return 'image/x-icon';
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return 'image/webp';
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = b.subarray(8, 12).toString('ascii');
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (brand.startsWith('hei') || brand === 'mif1' || brand === 'msf1') return 'image/heif';
  }
  return null;
}

/** Reads pixel dimensions straight from the header (no dependency needed). */
function sniffDimensions(buf) {
  const mime = sniffMime(buf);
  if (!mime) return null;
  const b = buf;
  try {
    if (mime === 'image/jpeg') {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const marker = b[i + 1];
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
        const len = b.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
        }
        i += 2 + len;
      }
      return null;
    }
    if (mime === 'image/png') {
      return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    }
    if (mime === 'image/gif') {
      return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
    }
    if (mime === 'image/bmp') {
      return { width: b.readInt32LE(18), height: Math.abs(b.readInt32LE(22)) };
    }
    if (mime === 'image/webp') {
      const tag = b.subarray(12, 16).toString('ascii');
      if (tag === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      if (tag === 'VP8L') {
        const bits = b.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (tag === 'VP8X') {
        return {
          width: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
          height: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
        };
      }
      return null;
    }
  } catch (_) { /* fall through */ }
  return null;
}

/** PNG/JPEG-free dimension probe is not enough for exotic formats -> null. */
function filenameFromUrl(url) {
  try {
    const p = new URL(url).pathname;
    const base = path.basename(p || '');
    return base && base.includes('.') ? decodeURIComponent(base) : 'download';
  } catch (_) { return 'download'; }
}

function extensionFor(mime) {
  const map = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
    'image/heic': '.heic', 'image/heif': '.heif', 'image/avif': '.avif',
    'image/bmp': '.bmp', 'image/tiff': '.tiff',
  };
  return map[mime] || '.img';
}

function isSupportedFormat(mime, filename) {
  if (!mime) return false;
  if (CONFIG.acceptedMime.includes(mime)) return true;
  const ext = path.extname(String(filename || '')).toLowerCase();
  return ['.heic', '.heif'].includes(ext) && CONFIG.acceptedMime.includes('image/heic');
}

/* ==========================================================================
 * 3. IMAGE ENGINE ADAPTER  (sharp -> fast native, jimp -> pure JS fallback)
 *
 *    sharp is used when its native binary loads (desktop / CI).
 *    jimp is pure JavaScript and therefore also works on Termux / Acode
 *    (Android bionic) where sharp has no prebuilt binary.
 * ========================================================================== */

async function loadSharp() {
  const sharp = require('sharp');
  await sharp({ create: { width: 2, height: 2, channels: 3, background: '#000' } })
    .raw()
    .toBuffer();
  return sharp;
}

/**
 * Backends are allowed to widen a single channel buffer (sharp turns a
 * greyscale raw image into RGB during resize). Normalise everything back to
 * exactly width*height single channel bytes.
 */
function toSingleChannel(buffer, width, height) {
  const expected = width * height;
  if (buffer.length === expected) return buffer;
  if (buffer.length === expected * 3) {
    const out = Buffer.allocUnsafe(expected);
    for (let i = 0; i < expected; i++) out[i] = buffer[i * 3];
    return out;
  }
  if (buffer.length === expected * 4) {
    const out = Buffer.allocUnsafe(expected);
    for (let i = 0; i < expected; i++) out[i] = buffer[i * 4];
    return out;
  }
  throw new ScrapeError(
    `Unexpected mask buffer size ${buffer.length} (expected ${expected})`,
    'MASK_SIZE_INVALID'
  );
}

function makeSharpAdapter(sharp) {
  return {
    name: 'sharp',
    async decode(buffer) {
      const image = sharp(buffer, { failOn: 'none' });
      const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      return { data: Buffer.from(data), width: info.width, height: info.height };
    },
    async resizeRgba(src, srcW, srcH, dstW, dstH) {
      return sharp(src, { raw: { width: srcW, height: srcH, channels: 4 } })
        .resize(dstW, dstH, { fit: 'fill', kernel: 'lanczos3' })
        .raw()
        .toBuffer();
    },
    async resizeGray(src, srcW, srcH, dstW, dstH) {
      const out = await sharp(src, { raw: { width: srcW, height: srcH, channels: 1 } })
        .resize(dstW, dstH, { fit: 'fill', kernel: 'lanczos3' })
        .toColourspace('b-w')
        .raw()
        .toBuffer();
      return toSingleChannel(out, dstW, dstH);
    },
    async encodePng(rgba, width, height) {
      return sharp(rgba, { raw: { width, height, channels: 4 } })
        .png({ compressionLevel: 9, palette: false })
        .toBuffer();
    },
    async flattenOnto(rgba, width, height, background) {
      return sharp(rgba, { raw: { width, height, channels: 4 } })
        .flatten({ background })
        .png({ compressionLevel: 9 })
        .toBuffer();
    },
  };
}

function makeJimpAdapter(Jimp) {
  const J = Jimp.Jimp || Jimp;
  return {
    name: 'jimp',
    async decode(buffer) {
      const img = await J.read(buffer);
      const { width, height, data } = img.bitmap;
      return { data: Buffer.from(data), width, height };
    },
    async resizeRgba(src, srcW, srcH, dstW, dstH) {
      const img = new J({ width: srcW, height: srcH, data: Buffer.from(src) });
      const out = img.resize(dstW, dstH);
      return Buffer.from(out.bitmap.data);
    },
    async resizeGray(src, srcW, srcH, dstW, dstH) {
      const rgba = Buffer.alloc(srcW * srcH * 4);
      for (let i = 0; i < srcW * srcH; i++) {
        rgba[i * 4] = src[i];
        rgba[i * 4 + 1] = src[i];
        rgba[i * 4 + 2] = src[i];
        rgba[i * 4 + 3] = 255;
      }
      const img = new J({ width: srcW, height: srcH, data: rgba });
      const out = img.resize(dstW, dstH);
      const buf = Buffer.from(out.bitmap.data);
      const gray = Buffer.alloc(dstW * dstH);
      for (let i = 0; i < dstW * dstH; i++) gray[i] = buf[i * 4];
      return toSingleChannel(gray, dstW, dstH);
    },
    async encodePng(rgba, width, height) {
      const img = new J({ width, height, data: Buffer.from(rgba) });
      return img.getBufferAsync('image/png');
    },
    async flattenOnto(rgba, width, height, background) {
      const bg = {
        r: parseInt(background.slice(1, 3), 16),
        g: parseInt(background.slice(3, 5), 16),
        b: parseInt(background.slice(5, 7), 16),
      };
      const out = Buffer.from(rgba);
      for (let i = 0; i < width * height; i++) {
        const a = out[i * 4 + 3] / 255;
        for (let c = 0; c < 3; c++) {
          const ch = [bg.r, bg.g, bg.b][c];
          out[i * 4 + c] = Math.round(out[i * 4 + c] * a + ch * (1 - a));
        }
        out[i * 4 + 3] = 255;
      }
      const img = new J({ width, height, data: out });
      return img.getBufferAsync('image/png');
    },
  };
}

let _imageEnginePromise = null;

/** Resolves the best available image backend (cached). */
function resolveImageEngine() {
  if (_imageEnginePromise) return _imageEnginePromise;
  _imageEnginePromise = (async () => {
    const errors = [];
    try {
      const sharp = await loadSharp();
      return makeSharpAdapter(sharp);
    } catch (err) {
      errors.push(`sharp: ${err.message}`);
    }
    try {
      const Jimp = require('jimp');
      const adapter = makeJimpAdapter(Jimp);
      // smoke test so a broken native build never blocks the run
      await adapter.decode(Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      ));
      return adapter;
    } catch (err) {
      errors.push(`jimp: ${err.message}`);
    }
    throw new ScrapeError(
      `No usable image backend (${errors.join('; ')}). Run: npm install sharp jimp`,
      'NO_IMAGE_BACKEND'
    );
  })();
  return _imageEnginePromise;
}

/** Decodes an image, transparently falling back between backends. */
async function decodeImage(buffer) {
  const engine = await resolveImageEngine();
  try {
    return { ...(await engine.decode(buffer)), engine };
  } catch (err) {
    try {
      const Jimp = require('jimp');
      const alt = makeJimpAdapter(Jimp);
      return { ...(await alt.decode(buffer)), engine: alt };
    } catch (_) {
      throw new ScrapeError(`Cannot decode image: ${err.message}`, 'DECODE_FAILED', { cause: err.message });
    }
  }
}

/* ==========================================================================
 * 4. ONNX RUNTIME ADAPTER
 * ========================================================================== */

let _ortPromise = null;

function resolveOrt() {
  if (_ortPromise) return _ortPromise;
  _ortPromise = (async () => {
    // Preferred: native runtime (much faster) - optional dependency.
    try {
      const ortNode = require('onnxruntime-node');
      return {
        kind: 'onnxruntime-node',
        ort: ortNode,
        async createSession(buffer) {
          return ortNode.InferenceSession.create(buffer, {
            executionProviders: ['cpu'],
            graphOptimizationLevel: 'all',
          });
        },
      };
    } catch (_) { /* native binary unavailable (Termux / unsupported libc) */ }

    // Fallback: portable WASM build - works on Node, Termux, Deno, Bun, browsers.
    const ortWeb = require('onnxruntime-web');
    const distDir = path.dirname(require.resolve('onnxruntime-web'));
    ortWeb.env.wasm.wasmPaths = distDir + path.sep;
    ortWeb.env.wasm.numThreads = Math.max(1, Math.min(4, os.cpus().length || 1));
    ortWeb.env.wasm.proxy = false;
    ortWeb.env.logLevel = 'error';
    return {
      kind: 'onnxruntime-web/wasm',
      ort: ortWeb,
      async createSession(buffer) {
        return ortWeb.InferenceSession.create(buffer, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        });
      },
    };
  })();
  return _ortPromise;
}

/* ==========================================================================
 * 5. MODEL MANAGER  (download + cache the public U2-Net weights)
 * ========================================================================== */

async function ensureModel(kind, { onProgress } = {}) {
  const spec = CONFIG.models[kind] || CONFIG.models.full;
  await fsp.mkdir(CONFIG.cacheDir, { recursive: true });
  const target = path.join(CONFIG.cacheDir, spec.file);

  let stat = null;
  try { stat = await fsp.stat(target); } catch (_) { /* not cached */ }

  if (!stat || stat.size < 1024) {
    const url = `${CONFIG.modelHost}/${spec.file}`;
    onProgress?.({ stage: 'model_download', url, bytes: 0, total: spec.approxBytes });
    const tmp = `${target}.part`;
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 0,
      maxRedirects: 5,
      headers: { 'User-Agent': CONFIG.userAgent },
      validateStatus: (s) => s === 200,
    });
    const writer = fs.createWriteStream(tmp);
    let received = 0;
    let lastPush = 0;
    response.data.on('data', (chunk) => {
      received += chunk.length;
      const now = Date.now();
      if (now - lastPush > 400) {
        lastPush = now;
        onProgress?.({ stage: 'model_download', url, bytes: received, total: spec.approxBytes });
      }
    });
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      response.data.on('error', reject);
      writer.on('error', reject);
      writer.on('finish', resolve);
    });
    await fsp.rename(tmp, target);
    onProgress?.({ stage: 'model_downloaded', url, bytes: received, total: received });
  }

  const buffer = await fsp.readFile(target);
  if (!buffer || buffer.length < 1024) {
    throw new ScrapeError('Downloaded model file is invalid', 'MODEL_INVALID');
  }
  return { buffer, path: target, bytes: buffer.length, label: spec.label };
}

/* ==========================================================================
 * 6. U2-NET ON-DEVICE ENGINE  (identical to the website's offline fallback)
 * ========================================================================== */

class U2NetEngine {
  constructor(options = {}) {
    this.options = options;
    this.session = null;
    this.sessionPromise = null;
    this.runtime = null;
    this.modelInfo = null;
  }

  async init(onProgress) {
    if (this.session) return this;
    if (!this.sessionPromise) {
      this.sessionPromise = (async () => {
        onProgress?.({ stage: 'model_load' });
        const runtime = await resolveOrt();
        this.runtime = runtime;

        let model = null;
        let lastErr = null;
        const kinds = this.options.model === 'lite' ? ['lite'] : ['full', 'lite'];
        for (const kind of kinds) {
          try {
            model = await ensureModel(kind, { onProgress });
            break;
          } catch (err) {
            lastErr = err;
          }
        }
        if (!model) throw lastErr || new ScrapeError('Unable to download the AI model', 'MODEL_UNAVAILABLE');
        this.modelInfo = model;

        onProgress?.({ stage: 'session_create' });
        this.session = await runtime.createSession(model.buffer);
        onProgress?.({ stage: 'session_ready', inputs: this.session.inputNames });
        return this;
      })().catch((err) => {
        this.sessionPromise = null;
        throw err;
      });
    }
    await this.sessionPromise;
    return this;
  }

  /** Returns a Float32Array mask of length w*h (values 0..255). */
  async segment(rgba, width, height, onProgress) {
    const S = CONFIG.modelSize;
    const engine = await resolveImageEngine();

    // 1. stretch to 320x320 (the website uses drawImage -> stretched, not fitted)
    const small = await engine.resizeRgba(rgba, width, height, S, S);
    const ch = 4;
    const pixels = S * S;
    const tensorData = new Float32Array(3 * pixels);
    const { mean, std } = CONFIG;
    for (let i = 0; i < pixels; i++) {
      const o = i * ch;
      tensorData[i] = (small[o] / 255 - mean[0]) / std[0];
      tensorData[pixels + i] = (small[o + 1] / 255 - mean[1]) / std[1];
      tensorData[2 * pixels + i] = (small[o + 2] / 255 - mean[2]) / std[2];
    }

    // 2. inference
    onProgress?.({ stage: 'inference' });
    const ort = this.runtime.ort;
    const inputName = this.session.inputNames[0];
    const tensor = new ort.Tensor('float32', tensorData, [1, 3, S, S]);
    const outputs = await this.session.run({ [inputName]: tensor });
    const output = outputs[this.session.outputNames[0]];
    let data = output.data;
    if (!data || !data.length) data = await output.getData();

    // 3. normalise the raw output to 0..255
    const maskSmall = new Uint8Array(S * S);
    for (let i = 0; i < S * S; i++) {
      const v = data[i];
      const clamped = v < 0 ? 0 : v > 1 ? 1 : v;
      maskSmall[i] = Math.round(clamped * 255);
    }

    // 4. upscale the mask back to the original resolution
    onProgress?.({ stage: 'mask_resize' });
    const maskFull = await engine.resizeGray(maskSmall, S, S, width, height);

    return maskFull;
  }
}

/**
 * Morphological opening (erosion then dilation) with a 5x5 kernel.
 * Byte-for-byte identical to the website's `morphologicalCleanup()`:
 * the 2 px outer border keeps the raw mask because the website only writes
 * the interior of the image.
 */
function morphologicalOpening(mask, width, height) {
  const out = new Uint8Array(width * height);
  out.set(mask.subarray(0, Math.min(mask.length, out.length)));
  const tmp = new Uint8Array(width * height);

  // horizontal erosion
  for (let row = 0; row < height; row++) {
    for (let col = 2; col < width - 2; col++) {
      let m = 255;
      for (let dc = -2; dc <= 2; dc++) {
        const v = mask[row * width + col + dc];
        if (v < m) m = v;
      }
      tmp[row * width + col] = m;
    }
  }
  // vertical erosion
  for (let row = 2; row < height - 2; row++) {
    for (let col = 2; col < width - 2; col++) {
      let m = 255;
      for (let dr = -2; dr <= 2; dr++) {
        const v = tmp[(row + dr) * width + col];
        if (v < m) m = v;
      }
      out[row * width + col] = m;
    }
  }
  // horizontal dilation
  for (let row = 0; row < height; row++) {
    for (let col = 2; col < width - 2; col++) {
      let m = 0;
      for (let dc = -2; dc <= 2; dc++) {
        const v = out[row * width + col + dc];
        if (v > m) m = v;
      }
      tmp[row * width + col] = m;
    }
  }
  // vertical dilation
  for (let row = 2; row < height - 2; row++) {
    for (let col = 2; col < width - 2; col++) {
      let m = 0;
      for (let dr = -2; dr <= 2; dr++) {
        const v = tmp[(row + dr) * width + col];
        if (v > m) m = v;
      }
      out[row * width + col] = m;
    }
  }
  return out;
}

/** Foreground statistics extracted from the alpha mask. */
function analyseMask(mask, width, height) {
  let fg = 0;
  let semi = 0;
  let transparent = 0;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  let sumX = 0, sumY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = mask[y * width + x];
      if (v === 0) { transparent++; continue; }
      if (v < 255) semi++;
      fg++;
      sumX += x; sumY += y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const total = width * height;
  const detected = fg / total > 0.005;
  return {
    detected,
    foreground_pixels: fg,
    foreground_ratio: Number((fg / total).toFixed(6)),
    transparent_pixels: transparent,
    soft_edge_pixels: semi,
    soft_edge_ratio: Number((semi / total).toFixed(6)),
    bounding_box: maxX < 0 ? null : {
      x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1,
    },
    centroid: fg ? { x: Math.round(sumX / fg), y: Math.round(sumY / fg) } : null,
  };
}

/* ==========================================================================
 * 7. CLOUD ENGINE  (the website's own API, signed + proof-of-work)
 *
 *    Kept for completeness / for networks that Cloudflare does not challenge.
 *    Requires no user supplied cookie: the scraper performs the whole
 *    boot -> hash -> proof-of-work -> signed POST handshake by itself.
 * ========================================================================== */

function solveProofOfWork(challenge, difficulty) {
  const half = difficulty >> 1;
  const odd = (difficulty & 1) === 1;
  for (let nonce = 0; ; nonce++) {
    const digest = crypto.createHash('sha256').update(`${challenge}:${nonce}`).digest();
    let ok = true;
    for (let i = 0; i < half; i++) {
      if (digest[i] !== 0) { ok = false; break; }
    }
    if (ok && odd && (digest[half] >> 4) !== 0) ok = false;
    if (ok) return { nonce, hash: digest.toString('hex') };
  }
}

function browserFingerprint() {
  const raw = [1920, 1080, 24, 8, 0, 'en-US', 'UTC', 1, 1, 'nwd'].join('|');
  return sha256hex(Buffer.from(raw, 'utf8')).slice(0, 16);
}

async function cloudRemoveBackground(buffer, mime, options) {
  // the cloud attempt gets its own, shorter budget so a blocked/challenged
  // endpoint can never stall the whole run
  const timeout = Math.min(options.timeout || CONFIG.defaultTimeout, options.cloudTimeout || 20000);

  const boot = await withRetry(async () => {
    const r = await axios.get(`${CONFIG.apiUrl}/boot`, {
      timeout,
      headers: { 'User-Agent': CONFIG.userAgent, Accept: 'application/json' },
    });
    return r.data;
  });

  if (!boot || !boot.p || !boot.s) {
    throw new ScrapeError('Unexpected /boot payload from the provider API', 'CLOUD_BAD_BOOT');
  }

  const timestamp = String(boot.t || Math.floor(Date.now() / 1000));
  const imageHash = sha256hex(buffer.subarray(0, Math.min(2048, buffer.length))).slice(0, 16);
  const signature = crypto
    .createHmac('sha256', `${boot.s}:${timestamp.slice(0, -1)}`)
    .update(`${timestamp}:${imageHash}`)
    .digest('hex');
  const pow = solveProofOfWork(`${timestamp}:${imageHash}`, boot.d || 5);

  const headers = {
    'User-Agent': CONFIG.userAgent,
    Origin: CONFIG.siteUrl.replace(/\/$/, ''),
    Referer: `${CONFIG.siteUrl.replace(/\/$/, '')}/upload/`,
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': mime,
    'X-App-Signature': signature,
    'X-App-Timestamp': timestamp,
    'X-PoW-Nonce': String(pow.nonce),
    'X-PoW-Hash': pow.hash,
    'X-Browser-FP': browserFingerprint(),
    'X-Turnstile-Token': '',
    'X-Interaction-Score': '2',
    'X-Time-On-Page': '6',
    'X-First-Interact': '2',
    'X-Move-Count': '11',
    'X-Key-Count': '3',
    'X-Scroll-Count': '2',
    'X-Request-Priority': 'single',
  };

  const url = `${CONFIG.apiUrl}${boot.p}/remove-background/`;
  const response = await axios.post(url, buffer, {
    timeout,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    headers,
    validateStatus: () => true,
    responseType: 'arraybuffer',
  });

  const contentType = String(response.headers['content-type'] || '');
  if (response.status !== 200 || !contentType.includes('image')) {
    const reason = response.headers['x-failure-reason'] || 'unknown';
    const detail = contentType.includes('html')
      ? 'Cloudflare challenge / WAF block (bot protection)'
      : `HTTP ${response.status}`;
    throw new ScrapeError(`Cloud engine refused the request: ${detail}`, 'CLOUD_BLOCKED', { reason, status: response.status });
  }

  return Buffer.from(response.data);
}

/* ==========================================================================
 * 8. SOURCE RESOLUTION  (GET url  |  POST file/base64)
 * ========================================================================== */

async function resolveSource(source, options) {
  const timeout = options.timeout || CONFIG.defaultTimeout;

  if (Buffer.isBuffer(source)) {
    return { buffer: source, filename: options.filename || 'upload.png', sourceType: 'buffer' };
  }

  if (typeof source === 'object' && source !== null) {
    if (source.buffer) {
      return {
        buffer: Buffer.isBuffer(source.buffer) ? source.buffer : Buffer.from(source.buffer),
        filename: source.filename || 'upload.png',
        sourceType: 'buffer',
      };
    }
    if (source.base64) {
      const clean = String(source.base64).replace(/^data:[^;]+;base64,/i, '');
      let buffer;
      try {
        buffer = Buffer.from(clean, 'base64');
      } catch (err) {
        throw new ScrapeError('Invalid base64 payload', 'INVALID_BASE64', { cause: err.message });
      }
      if (!buffer.length) throw new ScrapeError('Base64 payload decoded to an empty buffer', 'EMPTY_DATA');
      return { buffer, filename: source.filename || 'upload.png', sourceType: 'base64' };
    }
    if (source.file || source.path) {
      const file = source.file || source.path;
      let buffer;
      try {
        buffer = await fsp.readFile(file);
      } catch (err) {
        throw new ScrapeError(`Cannot read file "${file}": ${err.message}`, 'FILE_NOT_FOUND');
      }
      return { buffer, filename: source.filename || path.basename(file), sourceType: 'file' };
    }
    if (source.url) {
      return { ...(await downloadImage(source.url, options)), url: source.url, sourceType: 'url' };
    }
    throw new ScrapeError('Source object must contain one of: url, file, base64, buffer', 'INVALID_SOURCE');
  }

  const value = String(source || '').trim();
  if (!value) throw new ScrapeError('No input provided', 'EMPTY_DATA');

  if (isUrl(value)) {
    return { ...(await downloadImage(value, options)), url: value, sourceType: 'url' };
  }

  // A local path that exists?
  if (fs.existsSync(value) && fs.statSync(value).isFile()) {
    const buffer = await fsp.readFile(value);
    return { buffer, filename: path.basename(value), sourceType: 'file' };
  }

  // Otherwise treat it as a raw base64 payload (POST mode).
  const clean = value.replace(/^data:[^;]+;base64,/i, '');
  if (/^[A-Za-z0-9+/=\s]+$/.test(clean) && clean.length > 64) {
    let buffer;
    try {
      buffer = Buffer.from(clean, 'base64');
    } catch (err) {
      throw new ScrapeError('Input is neither a file, a URL nor valid base64', 'INVALID_SOURCE', { cause: err.message });
    }
    if (buffer.length && sniffMime(buffer)) {
      return { buffer, filename: options.filename || `upload${extensionFor(sniffMime(buffer))}`, sourceType: 'base64' };
    }
  }

  throw new ScrapeError(`Input "${value}" is not a valid file, URL or base64 image`, 'INVALID_SOURCE');
}

async function downloadImage(url, options = {}) {
  const timeout = options.timeout || CONFIG.defaultTimeout;
  let response;
  try {
    response = await withRetry(async () => axios.get(url, {
      timeout,
      responseType: 'arraybuffer',
      maxRedirects: 5,
      maxContentLength: Infinity,
      headers: {
        'User-Agent': CONFIG.userAgent,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: CONFIG.siteUrl,
      },
      validateStatus: (s) => s >= 200 && s < 400,
    }));
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      throw new ScrapeError(`Timed out while downloading "${url}"`, 'TIMEOUT', { url });
    }
    throw new ScrapeError(`Failed to download "${url}": ${err.message}`, 'NETWORK_ERROR', { url });
  }

  const buffer = Buffer.from(response.data);
  if (!buffer.length) throw new ScrapeError(`Empty response body from "${url}"`, 'EMPTY_DATA', { url });
  return {
    buffer,
    filename: options.filename || filenameFromUrl(response.request?.res?.responseUrl || url),
    mime: String(response.headers['content-type'] || '').split(';')[0].trim(),
  };
}

/* ==========================================================================
 * 9. MAIN PIPELINE
 * ========================================================================== */

async function removeBackground(source, options = {}) {
  const opts = {
    engine: options.engine || 'auto',        // auto | local | cloud
    model: options.model || 'full',          // full | lite
    timeout: options.timeout || CONFIG.defaultTimeout,
    cloudTimeout: options.cloudTimeout || 20000,
    refine: options.refine !== false,        // morphological edge refinement
    filename: options.filename,
    onProgress: options.onProgress,
    saveTo: options.saveTo,
    previewTo: options.previewTo,
    previewBackground: options.previewBackground || '#ffffff',
    keepBase64: options.keepBase64 !== false,
  };

  const started = Date.now();
  const resolved = await resolveSource(source, opts);
  const { buffer, filename, sourceType } = resolved;

  // ---- input validation -------------------------------------------------
  if (buffer.length > CONFIG.maxInputBytes) {
    throw new ScrapeError(
      `Image is too large (${(buffer.length / 1048576).toFixed(1)} MB, max 25 MB)`,
      'IMAGE_TOO_LARGE'
    );
  }
  const sniffed = sniffMime(buffer);
  const mime = sniffed || (source && source.mimeType) || 'application/octet-stream';
  if (!sniffed || !isSupportedFormat(sniffed, filename)) {
    throw new ScrapeError(
      `Unsupported image format${sniffed ? ` "${sniffed}"` : ''}. ` +
      `Accepted: ${CONFIG.acceptedMime.join(', ')}`,
      'UNSUPPORTED_FORMAT',
      { detected: sniffed, accepted: CONFIG.acceptedMime }
    );
  }

  // ---- decode -----------------------------------------------------------
  opts.onProgress?.({ stage: 'decode' });
  const decoded = await decodeImage(buffer);
  const { data: rgba, width, height } = decoded;
  if (!width || !height) throw new ScrapeError('Could not determine image dimensions', 'DECODE_FAILED');
  if (width * height > 40000000) {
    throw new ScrapeError('Image resolution is too large to process', 'IMAGE_TOO_LARGE');
  }

  const header = sniffDimensions(buffer) || { width, height };
  const inputInfo = {
    filename,
    mime_type: mime,
    size_bytes: buffer.length,
    width: header.width || width,
    height: header.height || height,
  };

  // ---- engine selection -------------------------------------------------
  const engineInfo = { requested: opts.engine, name: null, runtime: null, model: null, cloud_error: null };
  let cloudPng = null;

  if (opts.engine === 'auto' || opts.engine === 'cloud') {
    try {
      opts.onProgress?.({ stage: 'cloud_request' });
      cloudPng = await cloudRemoveBackground(buffer, mime, opts);
      engineInfo.name = 'removebackgrounds.ai-cloud-api';
    } catch (err) {
      engineInfo.cloud_error = { code: err.code || 'CLOUD_ERROR', message: err.message };
      if (opts.engine === 'cloud') throw err;
    }
  }

  let outputPng = cloudPng;
  let analysis = null;
  let finalRgba = null;

  if (!outputPng) {
    // on-device U2-Net engine
    const u2net = new U2NetEngine(opts);
    await u2net.init(opts.onProgress);
    engineInfo.name = 'u2net-onnx-on-device';
    engineInfo.runtime = u2net.runtime.kind;
    engineInfo.model = u2net.modelInfo.label;

    opts.onProgress?.({ stage: 'segment' });
    const rawMask = await u2net.segment(rgba, width, height, opts.onProgress);

    opts.onProgress?.({ stage: 'edge_refinement' });
    const refined = opts.refine
      ? morphologicalOpening(rawMask, width, height)
      : Uint8Array.from(rawMask);

    // apply the alpha mask onto the original pixels (full resolution)
    const out = Buffer.from(rgba);
    for (let i = 0; i < width * height; i++) {
      const m = refined[i];
      out[i * 4 + 3] = m < 127.5 ? 0 : m;
    }

    analysis = analyseMask(refined, width, height);
    finalRgba = { data: out, width, height };

    opts.onProgress?.({ stage: 'encode' });
    outputPng = await decoded.engine.encodePng(out, width, height);
  } else {
    // cloud result -> inspect it for the report
    const cloudDecoded = await decodeImage(outputPng).catch(() => null);
    if (cloudDecoded) {
      const { data: cRgba, width: cw, height: ch } = cloudDecoded;
      const alpha = new Uint8Array(cw * ch);
      for (let i = 0; i < cw * ch; i++) alpha[i] = cRgba[i * 4 + 3];
      analysis = analyseMask(alpha, cw, ch);
      finalRgba = { data: cRgba, width: cw, height: ch };
    }
  }

  // ---- write artefacts --------------------------------------------------
  let savedPath = null;
  if (opts.saveTo) {
    savedPath = path.resolve(opts.saveTo);
    await fsp.mkdir(path.dirname(savedPath), { recursive: true });
    await fsp.writeFile(savedPath, outputPng);
  }

  // Optional flattened preview: transparent PNGs are hard to judge in file
  // managers that ignore the alpha channel, so we can also render the
  // cut-out on a solid background.
  let previewPath = null;
  if (opts.previewTo && finalRgba) {
    previewPath = path.resolve(opts.previewTo);
    const flat = await decoded.engine.flattenOnto(
      finalRgba.data,
      finalRgba.width,
      finalRgba.height,
      opts.previewBackground || '#ffffff'
    );
    await fsp.mkdir(path.dirname(previewPath), { recursive: true });
    await fsp.writeFile(previewPath, flat);
  }

  const outputInfo = {
    filename: 'removed-background.png',
    format: 'image/png',
    mime_type: 'image/png',
    color_mode: 'RGBA',
    width: sniffDimensions(outputPng)?.width || width,
    height: sniffDimensions(outputPng)?.height || height,
    background: 'transparent',
    size_bytes: outputPng.length,
  };
  if (savedPath) outputInfo.file_path = savedPath;
  if (previewPath) outputInfo.preview_path = previewPath;
  if (opts.keepBase64) outputInfo.image_base64 = outputPng.toString('base64');

  const result = {
    status: 'success',
    message: 'Background removed successfully',
    data: {
      operation: 'remove_background',
      provider: CONFIG.provider,
      input: inputInfo,
      processing: {
        status: 'completed',
        foreground_detection: Boolean(analysis?.detected),
        background_segmentation: true,
        alpha_mask_generated: true,
        edge_refinement: Boolean(opts.refine),
        original_resolution_preserved:
          outputInfo.width === inputInfo.width && outputInfo.height === inputInfo.height,
      },
      output: outputInfo,
      source: {
        type: sourceType,
        url: resolved.url || (sourceType === 'url' ? String(source) : undefined),
        filename,
      },
      engine: {
        name: engineInfo.name,
        runtime: engineInfo.runtime,
        model: engineInfo.model,
        requested: engineInfo.requested,
        cloud_error: engineInfo.cloud_error,
        image_backend: decoded.engine.name,
      },
      detection: analysis
        ? {
            foreground_detected: analysis.detected,
            foreground_ratio: analysis.foreground_ratio,
            bounding_box: analysis.bounding_box,
            centroid: analysis.centroid,
            soft_edge_pixels: analysis.soft_edge_pixels,
            soft_edge_ratio: analysis.soft_edge_ratio,
          }
        : null,
      duration_ms: Date.now() - started,
    },
  };

  return result;
}

/* ==========================================================================
 * 10. SITE SCRAPER  (Axios + Cheerio)
 * ========================================================================== */

/**
 * Scrapes the public pages of removebackgrounds.ai.
 * Returns SEO metadata, the published tool catalogue and provider health.
 */
async function scrapeSite(url = CONFIG.siteUrl, options = {}) {
  const timeout = options.timeout || CONFIG.defaultTimeout;

  const response = await withRetry(async () => axios.get(url, {
    timeout,
    headers: {
      'User-Agent': CONFIG.userAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    validateStatus: (s) => s >= 200 && s < 400,
  }));

  const html = response.data;
  if (!html || !String(html).trim()) {
    throw new ScrapeError(`Empty HTML received from "${url}"`, 'EMPTY_DATA', { url });
  }

  const $ = cheerio.load(html);

  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try { jsonLd.push(JSON.parse($(el).contents().text())); } catch (_) { /* ignore */ }
  });

  const internalTools = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (/^\/[a-z0-9-]+\/?$/i.test(href) && text && text.length > 3) {
      internalTools.push({ url: new URL(href, url).toString(), title: text });
    }
  });

  const site = {
    url,
    final_url: response.request?.res?.responseUrl || url,
    status: response.status,
    title: ($('title').first().text() || '').replace(/\s+/g, ' ').trim(),
    description: ($('meta[name="description"]').attr('content') || '').trim(),
    canonical: $('link[rel="canonical"]').attr('href') || null,
    language: $('html').attr('lang') || null,
    og_title: $('meta[property="og:title"]').attr('content') || null,
    og_image: $('meta[property="og:image"]').attr('content') || null,
    headings: $('h1').map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean),
    sections: $('h2').map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean).slice(0, 40),
    images: $('img').length,
    internal_tool_links: internalTools.length,
    internal_tool_links_sample: internalTools.slice(0, 10),
    json_ld: jsonLd,
    formats_accepted: CONFIG.acceptedMime,
    api_catalog: null,
    health: null,
  };

  // published API catalog + provider health (best effort)
  try {
    const cat = await axios.get(new URL('/.well-known/api-catalog', url).toString(), {
      timeout, headers: { 'User-Agent': CONFIG.userAgent, Accept: 'application/json' },
      validateStatus: (s) => s === 200,
    });
    site.api_catalog = cat.data;
  } catch (_) { /* optional */ }

  try {
    const health = await axios.get(`${CONFIG.apiUrl}/health`, {
      timeout: Math.min(timeout, 10000),
      headers: { 'User-Agent': CONFIG.userAgent, Accept: 'application/json' },
      validateStatus: (s) => s === 200,
    });
    site.health = health.data;
  } catch (_) { /* optional */ }

  return site;
}

/**
 * Reads the published tool catalogue (llms.txt) with pagination.
 */
async function scrapeTools(options = {}) {
  const page = Math.max(1, parseInt(options.page || 1, 10));
  const pageSize = Math.max(1, parseInt(options.pageSize || 50, 10));
  const timeout = options.timeout || CONFIG.defaultTimeout;

  const res = await axios.get(new URL('/llms.txt', CONFIG.siteUrl).toString(), {
    timeout,
    headers: { 'User-Agent': CONFIG.userAgent, Accept: 'text/plain' },
    validateStatus: (s) => s === 200,
  });

  const tools = [];
  for (const line of String(res.data).split('\n')) {
    const m = /^-\s*\[([^\]]+)\]\(([^)]+)\)(?::\s*(.*))?$/.exec(line.trim());
    if (!m) continue;
    tools.push({ name: m[1], url: new URL(m[2], CONFIG.siteUrl).toString(), description: (m[3] || '').trim() });
  }

  const total = tools.length;
  const start = (page - 1) * pageSize;
  return {
    source: new URL('/llms.txt', CONFIG.siteUrl).toString(),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.max(1, Math.ceil(total / pageSize)),
    returned: tools.slice(start, start + pageSize),
  };
}

/* ==========================================================================
 * 11. CLI
 * ========================================================================== */

const HELP = `
scrape-removebg.js v${VERSION} - ${CONFIG.provider} background remover scraper

Usage
  node scrape-removebg.js "<file-or-url>" [options]

Examples
  node scrape-removebg.js "tes.jpg"                       POST mode (local file -> base64)
  node scrape-removebg.js "https://host/photo.jpg"         GET  mode (remote image)

Options
  --engine <auto|local|cloud>  processing backend          (default: auto)
  --model <full|lite>          U2-Net weights               (default: full)
  --out <file>                 JSON output path             (default: result.json)
  --save <file.png>            cut-out PNG path             (default: <out dir>/removed-background.png)
  --preview <file.png>         flattened preview PNG        (default: <out dir>/removed-background-preview.png)
  --preview-bg <#hex>          preview background colour   (default: #ffffff)
  --no-save                    do not write any PNG file
  --no-base64                  omit image_base64 from the JSON
  --no-refine                  skip the morphological edge refinement
  --timeout <ms>               request timeout              (default: ${CONFIG.defaultTimeout})
  --site                       also scrape removebackgrounds.ai metadata into the JSON
  --quiet                      only print the JSON to stdout
  --help                       show this help
`;

function parseArgs(argv) {
  const opts = { flags: new Set(), values: {} };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      opts.values[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      opts.values[key] = next;
      i++;
    } else {
      opts.flags.add(key);
    }
  }
  return opts;
}

async function runCli(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  const positional = argv.filter((a, i) => {
    if (a.startsWith('--')) return false;
    const prev = argv[i - 1];
    if (prev && prev.startsWith('--') && !prev.includes('=') &&
      ['engine', 'model', 'out', 'save', 'preview', 'preview-bg', 'timeout', 'filename'].includes(prev.slice(2))) return false;
    return true;
  });

  if (parsed.flags.has('help') || parsed.values.help !== undefined) {
    process.stdout.write(HELP);
    return 0;
  }
  if (!positional.length) {
    process.stderr.write(HELP);
    return 1;
  }

  const target = positional[0];
  const outPath = path.resolve(parsed.values.out || 'result.json');
  const quiet = parsed.flags.has('quiet');

  // The cut-out PNG is written next to the JSON report by default, so the
  // result is always viewable straight from the terminal.
  const outDir = path.dirname(outPath);
  const defaultPng = path.join(outDir, 'removed-background.png');
  const saveTo = parsed.flags.has('no-save')
    ? undefined
    : path.resolve(parsed.values.save || defaultPng);
  const previewTo = parsed.values.preview
    ? path.resolve(parsed.values.preview)
    : (parsed.flags.has('no-save') ? undefined : path.join(outDir, 'removed-background-preview.png'));

  const options = {
    engine: parsed.values.engine || 'auto',
    model: parsed.values.model || 'full',
    timeout: parsed.values.timeout ? parseInt(parsed.values.timeout, 10) : CONFIG.defaultTimeout,
    refine: !parsed.flags.has('no-refine'),
    keepBase64: !parsed.flags.has('no-base64'),
    saveTo,
    previewTo,
    previewBackground: parsed.values['preview-bg'] || '#ffffff',
    filename: parsed.values.filename,
    onProgress: quiet ? undefined : (p) => {
      const map = {
        model_download: `downloading AI model ${p.bytes ? `(${p.bytes}/${p.total})` : ''}`,
        model_downloaded: 'AI model ready',
        model_load: 'loading AI model',
        session_create: 'creating inference session',
        session_ready: 'engine ready',
        decode: 'decoding image',
        cloud_request: 'requesting cloud engine',
        segment: 'detecting foreground',
        inference: 'running U2-Net inference',
        mask_resize: 'upscaling alpha mask',
        edge_refinement: 'refining edges',
        encode: 'encoding PNG',
      };
      if (map[p.stage]) process.stderr.write(`  • ${map[p.stage]}\n`);
    },
  };

  let payload;
  try {
    const result = await removeBackground(target, options);
    if (parsed.flags.has('site')) {
      try {
        result.data.site = await scrapeSite(CONFIG.siteUrl, { timeout: options.timeout });
      } catch (err) {
        result.data.site = { error: err.message, code: err.code || 'SCRAPE_FAILED' };
      }
    }
    payload = result;
  } catch (err) {
    payload = {
      status: 'error',
      message: err.message || 'Unexpected error',
      error: { code: err.code || 'SCRAPE_ERROR', details: err.details || null },
      data: null,
    };
    if (!quiet) process.stderr.write(`\n✗ ${payload.message}\n`);
  }

  await fsp.mkdir(path.dirname(outPath), { recursive: true });
  await fsp.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');

  if (quiet) {
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  } else {
    const d = payload.data;
    if (payload.status === 'success') {
      process.stderr.write(
        `\n✓ ${payload.message}\n` +
        `  engine      : ${d.engine.name}${d.engine.model ? ` (${d.engine.model})` : ''}\n` +
        `  input       : ${d.input.filename} ${d.input.width}x${d.input.height} ${d.input.mime_type}\n` +
        `  output      : ${d.output.width}x${d.output.height} PNG/RGBA (${d.output.size_bytes} bytes)\n` +
        `  foreground  : ${(d.detection.foreground_ratio * 100).toFixed(2)}% of the frame\n` +
        `  duration    : ${d.duration_ms} ms\n` +
        `  result.json : ${outPath}\n`
      );
      if (d.output.file_path) {
        process.stderr.write(`  PNG (alpha) : ${d.output.file_path}\n`);
      }
      if (d.output.preview_path) {
        process.stderr.write(`  PNG (flat)  : ${d.output.preview_path}\n`);
      }
    }
  }

  return payload.status === 'success' ? 0 : 1;
}

/* ==========================================================================
 * 12. EXPORTS
 * ========================================================================== */

module.exports = {
  version: VERSION,
  config: CONFIG,
  ScrapeError,
  removeBackground,
  removeBackgroundFromUrl: (url, options) => removeBackground({ url }, options),
  removeBackgroundFromFile: (file, options) => removeBackground({ file }, options),
  removeBackgroundFromBase64: (base64, options = {}) =>
    removeBackground({ base64, filename: options.filename }, options),
  scrapeSite,
  scrapeTools,
  runCli,
  // helpers, handy for integrations
  helpers: {
    sniffMime,
    sniffDimensions,
    morphologicalOpening,
    solveProofOfWork,
    isSupportedFormat,
  },
};

if (require.main === module) {
  runCli().then(
    (code) => { process.exitCode = code; },
    (err) => {
      process.stderr.write(`Fatal: ${err && err.stack ? err.stack : err}\n`);
      process.exitCode = 1;
    }
  );
}
