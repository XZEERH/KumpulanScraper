#!/usr/bin/env node
/**
 * scrape-reminiv2.js
 * Remini (Google Play) scraper + AI Video Enhancer pipeline.  v2
 *
 * Target : https://play.google.com/store/apps/details?id=com.bigwinepot.nwdn.international
 * Output : result.json (root project) + output/<name>_hd.mp4
 *
 * Scraper engine : Axios (static HTML) + Cheerio parsing  -> ld+json, itemprops,
 *                  og:meta, play-lh regex fallback.      -> no browser needed
 * Video engine   : native ffmpeg/ffprobe (spawn) -> 2x lanczos upscale + denoise
 *                  + sharpen + color, H.264 MP4 output.  -> no heavy engine
 *
 * CLI   : node scrape-reminiv2.js ["tes.mp4" | video_url]
 * Module: const remini = require('./scrape-reminiv2.js');
 *         await remini.scrapeReminiApp();      // info app from Play Store
 *         await remini.enhance('tes.mp4');     // full pipeline
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const axios = require('axios');
const cheerio = require('cheerio');

const TARGET_URL =
  'https://play.google.com/store/apps/details?id=com.bigwinepot.nwdn.international';
const APP_ID = 'com.bigwinepot.nwdn.international';
const DEFAULT_FEATURE = 'AI Video Enhancer';
const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const BENIGN_UA =
  'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'output');
const TMP_DIR = path.join(ROOT, '.cache');
const RESULT_FILE = path.join(ROOT, 'result.json');

const FETCH_ATTEMPTS = Number(process.env.REMINI_V2_FETCH_ATTEMPTS || 4);
const ENHANCE_ATTEMPTS = Number(process.env.REMINI_V2_ENHANCE_ATTEMPTS || 3);
const FFMPEG_TIMEOUT_MS = Number(process.env.REMINI_V2_FFMPEG_TIMEOUT || 15 * 60 * 1000);
const MAX_URL_SIZE = 300 * 1024 * 1024;

const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm|mkv|flv|avi|wmv|ts|3gp|mpeg|mpg)$/i;

/* ---------------------------------------------------------------- util */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function localTime() {
  const d = new Date();
  return d.toISOString().replace('T', ' ').replace(/\..+/, 'Z');
}

function log(tag, msg) {
  console.error(`[${localTime()}][${tag}] ${msg}`);
}

function fmtBytes(bytes) {
  const b = Number(bytes) || 0;
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(2)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(2)} MB`;
  return `${(b / 1024).toFixed(2)} KB`;
}

function fmtMmss(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function fmtFps(rational) {
  if (!rational) return null;
  const s = String(rational).trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (m) {
    const den = Number(m[2]) || 1;
    if (den <= 0) return null;
    const v = Number(m[1]) / den;
    return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
  }
  const v = Number(s);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
}

function mkJobId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;
}

function formatName(probeFormat, filename) {
  const f = String(probeFormat || '').toLowerCase();
  if (f.includes('webm')) return 'webm';
  if (f.includes('mkv')) return 'mkv';
  if (f.includes('avi')) return 'avi';
  if (/mp4|m4v|mov|3gp|mj2/.test(f)) {
    const ext = path.extname(String(filename || '')).toLowerCase().replace('.', '');
    return ['.mp4', '.m4v', '.mov', '.3gp'].includes(`.${ext}`) ? ext : 'mp4';
  }
  return f.split(',')[0] || 'mp4';
}

function writeFileSafe(file, content) {
  try {
    fs.writeFileSync(file, content);
    return true;
  } catch (_) {
    return false;
  }
}

/* ------------------------------------------------------- axios + retry */

function axiosClient(timeout, ua) {
  return axios.create({
    timeout,
    maxRedirects: 5,
    maxContentLength: MAX_URL_SIZE,
    headers: {
      'User-Agent': ua || DEFAULT_UA,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'Cache-Control': 'no-cache'
    }
  });
}

/** keep retrying until success; jangan berhenti sebelum attempts habis */
async function withRetry(label, attempts, fn) {
  let lastErr = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn(i);
    } catch (e) {
      lastErr = e;
      if (i < attempts) {
        const wait = 1200 * i;
        log('retry', `${label} gagal (${i}/${attempts}): ${e && e.message ? e.message : e} -> tunggu ${wait}ms`);
        await sleep(wait);
      }
    }
  }
  throw lastErr || new Error(`${label} failed`);
}

/* -------------------------------------------------- play store scraper */

async function fetchPage(url, { attempts = FETCH_ATTEMPTS, timeout = 60000 } = {}) {
  const modes = [
    { ua: DEFAULT_UA, host: url },
    { ua: BENIGN_UA, host: url },
    { ua: BENIGN_UA, host: `${url}&gl=US&hl=en` }
  ];
  let lastErr = null;
  for (let m = 0; m < modes.length; m++) {
    try {
      return await withRetry(`fetchPage[${m}]`, attempts, async () => {
        const http = axiosClient(timeout, modes[m].ua);
        const res = await http.get(modes[m].host, { responseType: 'text', validateStatus: () => true });
        const html = typeof res.data === 'string' ? res.data : String(res.data || '');
        if (res.status !== 200) throw new Error(`http ${res.status}`);
        if (!html || html.length < 5000) throw new Error(`page too small (${html.length}b)`);
        return { html, status: res.status };
      });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('page fetch failed');
}

function parseProjectJson(html) {
  try {
    const $ = cheerio.load(html);
    const raw = $('script[type="application/ld+json"]').first().html();
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const m = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]{20,}?)<\/script>/i);
  if (m) {
    try {
      return JSON.parse(m[1]);
    } catch (_) {}
  }
  return null;
}

function cleanScreenshotUrl(raw) {
  let u = String(raw).replace(/&amp;/g, '&');
  u = u.split('=')[0];
  if (!/play-lh\.googleusercontent\.com\/[A-Za-z0-9_-]+/.test(u)) return null;
  return `${u}=w2560`;
}

function parseScreenshots(html) {
  const found = [];
  const push = (u) => {
    const c = cleanScreenshotUrl(u);
    if (c && !found.includes(c)) found.push(c);
  };
  try {
    const $ = cheerio.load(html);
    $('img[alt*="creenshot" i]').each((_, el) => {
      const src =
        $(el).attr('src') ||
        $(el).attr('data-src') ||
        ((($(el).attr('srcset') || '').split(',')[0] || '').trim().split(' ')[0]);
      if (src) push(src);
    });
    $('img[itemprop="image"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src) push(src);
    });
  } catch (_) {}
  const re = /play-lh\.googleusercontent\.com\/[A-Za-z0-9_-]+(?==w526-h296)/g;
  (html.match(re) || []).forEach((u) => push(`${u}=w526-h296`));
  return found.slice(0, 25);
}

function detectFeature(name, description, extra) {
  const hay = `${name || ''} ${description || ''} ${extra || ''}`;
  if (/video\s*enhanc|enhanc[a-z]*\s*video|video\s*enhancer|remini\s*video/i.test(hay)) {
    return 'AI Video Enhancer';
  }
  const m = hay.match(/AI Photo Enhancer|Photo Enhancer|AI Enhancer/i);
  return m ? `${m[0]}` : DEFAULT_FEATURE;
}

/** scrape app info dari Play Store (static HTML, tanpa browser engine) */
async function scrapeReminiApp(targetUrl = TARGET_URL, opts = {}) {
  const { html, status } = await fetchPage(targetUrl, opts);
  const ld = parseProjectJson(html) || {};

  let name = ld.name || null;
  let description = ld.description || null;
  let icon = ld.image || null;
  const developer = (ld.author && ld.author.name) || null;
  const rating = (ld.aggregateRating && ld.aggregateRating.ratingValue) || null;
  const ratingCount = (ld.aggregateRating && ld.aggregateRating.ratingCount) || null;
  const price = (Array.isArray(ld.offers) && ld.offers[0] && ld.offers[0].price) || null;
  const category = ld.applicationCategory || null;

  const $ = cheerio.load(html);
  if (!name) name = ($('span[itemprop="name"]').first().text() || '').trim() || ($('meta[property="og:title"]').attr('content') || '').replace(/ - Apps on Google Play$/i, '').trim() || null;
  if (!description) description = ($('div[itemprop="description"]').first().text() || '').trim() || ($('meta[name="description"]').attr('content') || '').trim() || null;
  if (!icon) icon = $('img[itemprop="image"][alt*="over image" i]').first().attr('src') || ($('meta[property="og:image"]').attr('content') || null);

  const screenshots = parseScreenshots(html);
  if (!name && !description && screenshots.length === 0) {
    throw new Error('empty app data (page layout changed)');
  }

  return {
    package: APP_ID,
    url: ld.url || targetUrl,
    http_code: status,
    name,
    developer,
    description: description ? String(description).slice(0, 4000) : null,
    category,
    contentRating: ld.contentRating || null,
    rating,
    ratingCount,
    price,
    currency: (Array.isArray(ld.offers) && ld.offers[0] && ld.offers[0].priceCurrency) || null,
    icon,
    feature: detectFeature(name, description),
    screenshots
  };
}

/* ------------------------------------------------------ video metadata */

function findBin(name, envKey) {
  if (process.env[envKey] && fs.existsSync(process.env[envKey])) return process.env[envKey];
  try {
    const w = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], {
      encoding: 'utf8',
      shell: process.platform !== 'win32'
    });
    const hit = (w.stdout || '').split('\n').map((s) => s.trim()).filter((s) => s && fs.existsSync(s))[0];
    if (hit) return hit;
  } catch (_) {}
  const cands =
    process.platform === 'android'
      ? ['/data/data/com.termux/files/usr/bin']
      : [process.env.PREFIX, '/data/data/com.termux/files/usr/bin']
          .filter(Boolean)
          .map((p) => path.join(p, 'bin'));
  cands.push(path.join(os.tmpdir(), 'bin'));
  for (const dir of cands) {
    const p = path.join(dir, name);
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return null;
}

let ffprobeBin = null;

/**
 * Pure-JS MP4 box parser (fallback probe kalau ffprobe tidak ada).
 * Ambil mvhd (duration/timescale), tkhd (width/height), hdlr (track type),
 * stts (jumlah sample utk estimasi fps), avc1 (format).
 */
function parseMp4Fallback(file) {
  const buf = fs.readFileSync(file);
  const view = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const be32 = (o) => view.getUint32(o, false);
  const be64 = (o) => Number(view.getBigUint64(o, false));
  const type = (o) => String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
  const out = {};

  function find(boot, want, end) {
    let p = boot;
    while (p + 8 <= end) {
      let size = be32(p);
      const t = type(p + 4);
      if (size === 1 || size === 0) break; // header extended -> abaikan
      if (t === want) return p;
      p += size;
    }
    return -1;
  }

  const moov = find(0, 'moov', buf.length);
  if (moov < 0) return null;
  const moovEnd = moov + be32(moov);

  const mvhd = find(moov + 8, 'mvhd', moovEnd);
  if (mvhd >= 0) {
    const ver = buf[mvhd + 8];
    if (ver === 0) {
      out.timescale = be32(mvhd + 20);
      out.duration = be32(mvhd + 24);
    } else {
      out.timescale = be32(mvhd + 28);
      out.duration = be64(mvhd + 32);
    }
  }

  // cari tiap trak
  let p = moov + 8;
  while (p + 8 <= moovEnd) {
    const size = be32(p);
    if (type(p + 4) === 'trak') {
      const trakEnd = p + size;
      const hdlr = find(p + 8, 'hdlr', trakEnd);
      const tkhd = find(p + 8, 'tkhd', trakEnd);
      const mdhd = find(p + 8, 'mdhd', trakEnd);
      const isVideo = hdlr >= 0 && buf.slice(hdlr + 16, hdlr + 20).toString('latin1') === 'vide';
      if (isVideo) {
        if (tkhd >= 0) {
          out.width = be32(tkhd + size - 8) / 65536;
          out.height = be32(tkhd + size - 4) / 65536;
        }
        if (mdhd >= 0) {
          const ver = buf[mdhd + 8];
          out.trackTimescale = ver === 0 ? be32(mdhd + 20) : be32(mdhd + 28);
          out.trackDuration = ver === 0 ? be32(mdhd + 24) : be64(mdhd + 32);
        }
        const stts = find(p + 8, 'stts', trakEnd);
        if (stts >= 0) {
          const cnt = be32(stts + 12);
          let samples = 0;
          for (let e = 0; e < cnt; e++) {
            const off = stts + 16 + e * 8;
            if (off + 8 > stts + size) break;
            samples += be32(off);
          }
          if (samples && out.trackTimescale && out.trackDuration) {
            out.fps = samples / (out.trackDuration / out.trackTimescale);
          }
        }
        const stsd = find(p + 8, 'stsd', trakEnd);
        if (stsd >= 0 && stsd + 24 <= stsd + size) out.codec = buf.slice(stsd + 20, stsd + 24).toString('latin1');
      }
      p = trakEnd;
      // deteksi audio track sederhana
      if (hdlr >= 0 && buf.slice(hdlr + 16, hdlr + 20).toString('latin1') === 'soun') out.hasAudioTrack = true;
      continue;
    }
    p += size || 8;
  }

  if (!out.width || !out.height || !out.duration) return null;
  const seconds = out.duration / (out.timescale || 1000);
  return {
    width: Math.round(out.width),
    height: Math.round(out.height),
    duration: seconds,
    fps: out.fps ? Math.round(out.fps * 100) / 100 : null,
    codec: out.codec || 'unknown',
    audio: !!out.hasAudioTrack,
    format: 'mp4',
    probe: 'js-mp4'
  };
}

async function probeVideoFile(inputPath) {
  const bin = ffprobeBin || findBin('ffprobe', 'FFPROBE_PATH') || findBin('ffmpeg', 'FFMPEG_PATH');
  if (bin && /bin\/ffprobe|ffprobe/i.test(bin)) ffprobeBin = bin;
  else if (bin) ffprobeBin = null;

  if (bin) {
    try {
      return await withRetry('ffprobe', 3, async () => {
        const meta = await runFfprobe(bin, inputPath);
        if (!meta || !meta.width || !meta.duration) throw new Error('probe kosong/tidak valid');
        return meta;
      });
    } catch (e) {
      log('probe', `ffprobe gagal: ${e.message} -> fallback parser MP4 JS`);
    }
  }
  const js = parseMp4Fallback(inputPath);
  if (!js) throw new Error(`tidak bisa membaca metadata video: ${path.basename(inputPath)} (pasang ffmpeg: pkg install ffmpeg / apk add ffmpeg)`);
  return js;
}

function runFfprobe(bin, file) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'stream=index,codec_type,codec_name,width,height,avg_frame_rate,r_frame_rate,duration,bit_rate',
      '-show_entries', 'format=format_name,duration,size,bit_rate',
      '-of', 'json', file
    ];
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    const kill = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch (_) {}
      reject(new Error('ffprobe timeout'));
    }, 60000);
    child.on('close', (code) => {
      clearTimeout(kill);
      try {
        const j = JSON.parse(out || '{}');
        const streams = j.streams || [];
        const v = streams.find((s) => s.codec_type === 'video') || null;
        const hasAudio = streams.some((s) => s.codec_type === 'audio');
        if (!v) throw new Error('tidak ada video stream');
        resolve({
          width: Number(v.width) || null,
          height: Number(v.height) || null,
          duration: Number((v.duration && Number(v.duration)) || (j.format && Number(j.format.duration)) || 0) || null,
          fps: fmtFps(v.avg_frame_rate) || fmtFps(v.r_frame_rate) || null,
          codec: v.codec_name || null,
          audio: hasAudio,
          format: String((j.format && j.format.format_name) || 'mp4').split(',')[0],
          size: (j.format && Number(j.format.size)) || null,
          probe: 'ffprobe'
        });
      } catch (e) {
        reject(new Error(`ffprobe parse: ${e.message} / ${err.slice(0, 120)}`));
      }
    });
  });
}

/* ------------------------------------------------------ video enhancer */

/** engine utama: ffmpeg (2x lanczos + denoise + sharpen + warna) */
function runFfmpegFilter(bin, inputPath, outPath, filter, meta) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y', '-hide_banner', '-nostdin',
      '-loglevel', 'warning',
      '-stats',
      '-nostdin',
      '-i', inputPath,
      '-vf', filter,
      '-vsync', 'cfr',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
      ...(meta && meta.audio ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']),
      '-movflags', '+faststart',
      outPath
    ];
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    let lastTick = 0;
    child.stderr.on('data', (d) => {
      err += d;
      const line = String(d);
      const m = line.match(/time=\s*(\d+):(\d+):(\d+\.?\d*)/g);
      const last = m && m[m.length - 1];
      const now = Date.now();
      if (last && now - lastTick > 2000) {
        lastTick = now;
        log('ffmpeg', `progress ${last.trim()}`);
      }
    });
    child.on('error', reject);
    const kill = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch (_) {}
      reject(new Error(`ffmpeg timeout (${Math.round(FFMPEG_TIMEOUT_MS / 1000)}s)`));
    }, FFMPEG_TIMEOUT_MS);
    child.on('close', (code) => {
      clearTimeout(kill);
      if (code === 0 && fs.existsSync(outPath) && fs.statSync(outPath).size > 1024) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${(err.match(/Error[^\n]*/) || [err.slice(-200)])[0].slice(0, 200)}`));
    });
  });
}

async function localEnhanceVideo(inputPath, outPath, meta) {
  const bin = findBin('ffmpeg', 'FFMPEG_PATH');
  if (!bin) {
    throw new Error(
      'engine ffmpeg tidak ditemukan. pasang dulu: Termux -> pkg install ffmpeg | Alpine -> apk add ffmpeg | Debian/Ubuntu -> apt install ffmpeg | macOS -> brew install ffmpeg'
    );
  }
  const chains = [
    'scale=iw*2:ih*2:flags=lanczos,hqdn3d=1:0.8:6:6,unsharp=5:5:0.8:5:5:0.4,eq=contrast=1.06:saturation=1.10:brightness=0.02',
    'scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:0.8:5:5:0.4',
    'scale=iw*2:ih*2:flags=bicubic'
  ];
  let lastErr = null;
  for (let i = 0; i < chains.length; i++) {
    try {
      log('engine', `ffmpeg upscale 2x (filter #${i + 1})`);
      await runFfmpegFilter(bin, inputPath, outPath, chains[i], meta);
      return { engine: 'ffmpeg', filter: chains[i].split(',')[0] };
    } catch (e) {
      lastErr = e;
      log('engine', `filter #${i + 1} gagal: ${e.message}`);
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {}
    }
  }
  throw lastErr || new Error('semua filter ffmpeg gagal');
}

/* ------------------------------------------------------------ pipeline */

function resolveInputPath(source) {
  if (/^https?:\/\//i.test(source)) return source;
  const clean = String(source).trim().replace(/^['"]|['"]$/g, '');
  const candidates = [
    path.resolve(process.cwd(), clean),
    path.resolve(ROOT, clean),
    path.resolve(ROOT, 'public', clean),
    path.resolve(ROOT, 'output', clean)
  ];
  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  throw new Error(`input file not found: ${source}`);
}

async function downloadIfUrl(source) {
  if (!/^https?:\/\//i.test(source)) return { inputPath: source, originalUrl: null, fromTmp: false };
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const urlObj = new URL(source);
  let fname = path.basename(urlObj.pathname).split('?')[0] || 'download.mp4';
  if (!VIDEO_EXT_RE.test(fname)) fname = `${fname}.mp4`;
  const dest = path.join(TMP_DIR, `in_${Date.now()}_${fname}`);
  await withRetry('download', 3, async () => {
    const http = axiosClient(180000);
    const res = await http.get(source, { responseType: 'arraybuffer', maxContentLength: MAX_URL_SIZE });
    const size = res.data ? Buffer.byteLength(res.data) : 0;
    if (size < 4096) throw new Error('file terlalu kecil / kosong');
    fs.writeFileSync(dest, Buffer.from(res.data));
  });
  return { inputPath: dest, originalUrl: source, fromTmp: true };
}

function baseResult(feature, job_id) {
  return {
    status: false,
    feature,
    original_video: null,
    enhanced_video: null,
    original_filename: null,
    output_filename: null,
    original_size: null,
    output_size: null,
    original_resolution: null,
    output_resolution: null,
    original_duration: null,
    output_duration: null,
    original_fps: null,
    output_fps: null,
    output_format: null,
    enhancement_scale: null,
    processing_time: null,
    job_id,
    error: null
  };
}

function finalize(result) {
  writeFileSafe(RESULT_FILE, JSON.stringify(result, null, 2));
  if (result.job_id) {
    writeFileSafe(path.join(OUT_DIR, `result_${result.job_id}.json`), JSON.stringify(result, null, 2));
  }
  return result;
}

/**
 * Full pipeline: scrape target -> ambil video -> probe -> enhance 2x -> result.json
 */
async function enhance(source, opts = {}) {
  const started = Date.now();
  const job_id = mkJobId('video_enhance');

  let inputPath = null;
  let fromTmp = false;
  const cleanup = () => {
    try {
      if (fromTmp && inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch (_) {}
  };

  try {
    /* 1. scrape target page */
    log('scrape', `GET ${TARGET_URL}`);
    let app = null;
    let appStatus = '';
    try {
      app = await withRetry('scrapeReminiApp', 2, () => scrapeReminiApp(TARGET_URL, { attempts: opts.appAttempts || FETCH_ATTEMPTS }));
      appStatus = `scraped ${app.http_code} (${app.name || '?'}, ${app.screenshots.length} screenshots, rating ${app.rating})`;
    } catch (e) {
      appStatus = `scrape gagal: ${e.message} -> fallback "${DEFAULT_FEATURE}"`;
    }
    log('scrape', appStatus);

    /* 2. siapkan input */
    const resolved = resolveInputPath(source || 'tes.mp4');
    const dl = await downloadIfUrl(resolved);
    inputPath = dl.inputPath;
    fromTmp = dl.fromTmp;
    if (!fs.existsSync(inputPath)) throw new Error('input tidak tersedia');

    /* 3. probe metadata asli */
    const inStat = fs.statSync(inputPath);
    const meta = await probeVideoFile(inputPath);
    log('probe', `original: ${meta.width}x${meta.height} @${meta.fps || '?'}fps ${fmtMmss(meta.duration)} (${fmtBytes(inStat.size)}, ${meta.codec}, probe=${meta.probe})`);

    const original_filename = path.basename(inputPath);
    const output_filename = `${original_filename.replace(/\.[^.]+$/, '')}_hd.mp4`;
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, output_filename);
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {}

    /* 4. enhance engine (ffmpeg) - retry sampai attempt habis */
    log('enhance', `start job ${job_id}`);
    const engine = await withRetry('enhance', ENHANCE_ATTEMPTS, async (i) => {
      log('enhance', `percobaan ${i}/${ENHANCE_ATTEMPTS}`);
      return localEnhanceVideo(inputPath, outPath, meta);
    });

    /* 5. verifikasi output */
    if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1024) throw new Error('output video kosong/tidak valid');
    const outStat = fs.statSync(outPath);
    const outMeta = await probeVideoFile(outPath);
    if (!outMeta.width || !outMeta.height) throw new Error('output tidak bisa di-probe');
    if (outMeta.width <= meta.width) throw new Error('output tidak ter-upscale (perbaikan parser filter)');

    /* 6. hasil akhir */
    const result = {
      status: true,
      feature: /video/i.test((app && app.feature) || '') ? app.feature : DEFAULT_FEATURE,
      original_video: dl.originalUrl || path.resolve(inputPath),
      enhanced_video: path.resolve(outPath),
      original_filename,
      output_filename,
      original_size: fmtBytes(inStat.size),
      output_size: fmtBytes(outStat.size),
      original_resolution: `${meta.width}x${meta.height}`,
      output_resolution: `${outMeta.width}x${outMeta.height}`,
      original_duration: fmtMmss(meta.duration),
      output_duration: fmtMmss(outMeta.duration),
      original_fps: meta.fps != null ? meta.fps : null,
      output_fps: outMeta.fps != null ? outMeta.fps : null,
      output_format: formatName(outMeta.format, output_filename),
      enhancement_scale: `${Math.round((outMeta.width / meta.width) * 100) / 100}x`,
      processing_time: `${((Date.now() - started) / 1000).toFixed(1)}s`,
      job_id,
      error: null
    };

    if (app) log('target', `${app.name} | ${app.developer} | ${appStatus}`);
    else log('target', appStatus);
    log('done', `${output_filename} | ${result.original_resolution} -> ${result.output_resolution} | ${result.processing_time}`);

    cleanup();
    return finalize(result);
  } catch (e) {
    const result = baseResult(DEFAULT_FEATURE, job_id);
    result.status = false;
    result.error = String((e && e.message) || e);
    const wantOriginal = String(typeof source === 'string' ? source : (source && source.original) || '');
    try {
      if (wantOriginal && fs.existsSync(resolveInputPath(wantOriginal))) {
        result.original_video = path.resolve(resolveInputPath(wantOriginal));
        const st = fs.statSync(result.original_video);
        result.original_filename = path.basename(result.original_video);
        result.original_size = fmtBytes(st.size);
      }
    } catch (_) {}
    result.processing_time = `${((Date.now() - started) / 1000).toFixed(1)}s`;
    log('error', result.error);
    cleanup();
    return finalize(result);
  }
}

async function runCLI(argv) {
  let arg = (argv[0] || '').trim().replace(/^['"]+|["']$/g, '');
  if (!arg && fs.existsSync(path.resolve(process.cwd(), 'tes.mp4'))) arg = 'tes.mp4';
  if (!arg) {
    console.error('Usage: node scrape-reminiv2.js <tes.mp4 | video_url>');
    process.exit(1);
  }
  const result = await enhance(arg);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status ? 0 : 1;
}

module.exports = {
  TARGET_URL,
  APP_ID,
  scrapeReminiApp,
  detectFeature,
  resolveInputPath,
  probeVideoFile,
  parseMp4Fallback,
  localEnhanceVideo,
  enhance,
  runCLI
};

if (require.main === module) {
  runCLI(process.argv.slice(2)).catch((e) => {
    console.error(`[fatal] ${(e && e.message) || e}`);
    process.exitCode = 1;
  });
}
