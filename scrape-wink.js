#!/usr/bin/env node
'use strict';

/*
 * Name : Wink AI Image Enhancer
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://wink.ai/image-enhancer
 * Type ' CJS
 * description : Tingkatkan kualitas gambar dengan Enhancer wink ai HD, Ultra HD dan UHD
 ---------------------------------------------------------------------------

 * Dua kemampuan utama:
 *
 * 1.SCRAPE metadata fitur Image Enhancer (mode HD / Ultra HD / AI UHD),parameter, format, batas ukuran, proses, dll. -> JSON Sumber data dari Endpoint PUBLIK  GET /api/meitu_ai/ai_type_config.json (config algoritma asli + input_limit: format, max_size, max_edge) HTML SSR /image-enhancer (JSON-LD HowTo + FAQ, heading, paragraf). Payload i18n Next.js (self.__next_f) dari halaman upload Metode eksekusi menggunakan Axios + Cheerio (tanpa headless browser).  TERVERIFIKASI jalan.
 *
 * 2.ENHANCE gambar nyata (unggah -> buat task -> polling -> unduh hasil), memakai endpoint privat Wink.  Endpoint, method, header & payload asli ditemukan dari reverse-engineering bundle JS klien (lihat ENDPOINTS).
 *
 * Note : seluruh endpoint task/enhance milik Wink WAJIB LOGIN (cookie `__mt_access_token__` / header `Access-Token`). Tanpa sesi login yang valid server membalas: {"code":10111,"message":"登录验证失败，请先登录"}, ("verifikasi login gagal, silakan login dulu"). Script TIDAK bisa membuat akun sendiri, jadi mode enhance hanya berjalan bila kamu memasok sesi login Anda (--cookie / --cookie-file / env WINK_COOKIE). Bila tidak ada,script berhenti dengan pesan error yang jelas. Btw error fix sendiri
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

let jpegJs = null;
try { jpegJs = require('jpeg-js'); } catch (_) { jpegJs = null; }

// ===========================================================================
// KONFIGURASI & TEMUAN ENDPOINT
// ===========================================================================
const BASE = 'https://wink.ai';
const SITE = 'https://wink.ai';
const CLIENT_ID = '1189857605';
const API_VERSION = '1.0.0';

const DEFAULTS = {
  page: BASE + '/image-enhancer',
  uploadPage: BASE + '/image-enhancer/upload',
  out: 'wink-image-enhancer.json',
  outDir: './output',
  timeout: 30000,
  retries: 3,
  maxRedirects: 5,
  pollInterval: 3000,
  maxWait: 300000,
  userAgent:
    'Mozilla/5.0 (Linux; Android 12; Termux) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/120.0 Mobile Safari/537.36 wink-scraper/2.0',
  acceptLanguage: 'en-US,en;q=0.9',
  countryCode: 'US',
  clientLanguage: 'en-US',
  clientTimezone: 'UTC',
  gnum: 1,
};

// Query parameter "klien" yang wajib ada di hampir semua endpoint /api.
// Ditemukan di bundle: {clientId:API_CLIENT_ID, version:API_VERSION, countryCode, gnum, ...}
function clientParams(extra) {
  return Object.assign(
    {
      client_id: CLIENT_ID,
      version: API_VERSION,
      gnum: DEFAULTS.gnum,
      country_code: DEFAULTS.countryCode,
      client_language: DEFAULTS.clientLanguage,
      client_timezone: DEFAULTS.clientTimezone,
    },
    extra || {}
  );
}

// ---- ENDPOINT ASLI yang ditemukan (relatif terhadap https://wink.ai) -------
const ENDPOINTS = {
  // PUBLIK (tanpa login) — config algoritma semua fitur + input_limit
  aiTypeConfig: '/api/meitu_ai/ai_type_config.json?withFuncLimit=1',
  geo: '/xapi/geo',
  // Upload (butuh login). Multipart `media` (file) atau `media_url` (url).
  upload: '/api/v1/upload',
  // Tanda tangan upload Meitu (@meitu/upload SDK). app=wink type=temp
  maatSign: '/api/file/get_maat_sign.json',
  // Buat + kirim (deliver) grup task. Payload: {taskType, name, subtaskList:[...]}
  createDeliveryGroup: '/api/meitu_ai_task_group/create_and_delivery.json',
  // Alias workflow (AI Workflow). Payload: {steps:[...]}
  workflowCreate: '/api/meitu_ai/workflow/create.json',
  workflowDeal: '/api/meitu_ai/workflow/deal_task.json',
  workflowDetail: '/api/meitu_ai/workflow/detail.json',
  workflowInfo: '/api/meitu_ai/workflow/info.json',
  // Cek status task
  taskFeedList: '/api/meitu_ai/task_feed_list.json',
  queryBatch: '/api/meitu_ai/query_batch.json',              // ?msgIds=a,b
  taskGroupList: '/api/meitu_ai_task_group/task_list.json',  // ?groupIds=x
  taskGroupQuery: '/api/meitu_ai_task_group/query_batch.json',
  predictElapsed: '/api/meitu_ai/get_predict_elapsed.json',
  costPreview: '/api/meitu_ai/workflow/cost_preview.json',
  userInfo: '/api/meitu_ai/user/info.json',
};

// ---- Pemetaan mode Image Enhancer -> parameter algoritma asli --------------
// Sumber: bundle klien, staticDefinition featureId=ImageEnhancer (materialId 630)
//   hd      -> functionId 63090
//   live    -> functionId 63091  (Ultra HD / 超清)
//   enhance -> functionId 63092  (Portrait Enhance / 人像增强)
//   aiLive  -> functionId 63093  (AI UHD / AI超清)
//   proRepair -> 63100, aigc -> 63101, concert -> 63099
// Dikonfirmasi silang dengan ai_type_config.json (func_id & type).
const MODES = {
  HD: {
    id: 'HD',
    name: 'HD',
    slug: 'hd',
    functionId: 63090,
    functionType: 2,
    materialId: '63001',
    variant: 'hd',
    targetType: 1,
    taskType: 1,
    beans: 2,
    vipBeans: 1,
    useNeedVip: 0,
    tier: 'free',
    extValue: '1',
    zhName: '画质修复-高清(图片)',
    description:
      'Peningkatan kejernihan standar: memperjelas gambar buram, menajamkan tepi/detail, dan menaikkan resolusi rendah ke kualitas HD.',
    resolution: {
      input: 'Resolusi rendah–sedang; maks sisi panjang 7999 px, maks sisi pendek 7999 px, ≤30 MB.',
      output: 'HD (kelas 720p–1080p); resolusi keluaran tidak dipatok tetap (menyesuaikan input).',
      upscale: 'Upscale ke HD.',
      source: 'ai_type_config input_limit + klaim halaman (upscale to HD).',
    },
  },
  'Ultra HD': {
    id: 'Ultra HD',
    name: 'Ultra HD',
    slug: 'ultrahd',
    functionId: 63091,
    functionType: 12,
    materialId: '63011',
    variant: 'live',
    targetType: 2,
    taskType: 1,
    beans: 4,
    vipBeans: 2,
    useNeedVip: 0,
    tier: 'free',
    extValue: '2',
    zhName: '画质修复-超清(图片)',
    description:
      'Restorasi + penajaman, direkomendasikan untuk peningkatan umum foto resolusi rendah hingga Ultra HD/4K.',
    resolution: {
      input: 'Resolusi rendah–tinggi; maks sisi panjang 7999 px, maks sisi pendek 7999 px, ≤30 MB.',
      output: 'Ultra HD / 4K; resolusi keluaran tidak dipatok tetap (menyesuaikan input).',
      upscale: 'Upscale hingga Ultra HD/4K.',
      source: 'ai_type_config input_limit + klaim Meta ("upscale ... to HD or 4K").',
    },
  },
  'AI UHD': {
    id: 'AI UHD',
    name: 'AI UHD',
    slug: 'uhd',
    functionId: 63093,
    functionType: 55,
    materialId: '63031',
    variant: 'aiLive',
    targetType: 4,
    taskType: 1,
    beans: 8,
    vipBeans: 4,
    useNeedVip: 1,
    tier: 'premium',
    extValue: '4',
    zhName: 'AI超清(图片)',
    description:
      'AI UHD (AI超清): Advanced Restoration 3.0 — AI mengisi detail yang hilang, memperbesar 2–3×. Butuh VIP.',
    resolution: {
      input: 'Resolusi rendah; maks sisi panjang 7999 px, maks sisi pendek 7999 px, ≤30 MB.',
      output: '≈2–3× dari input (di atas Ultra HD); resolusi keluaran tidak dipatok tetap.',
      upscale: '2–3× (Advanced Restoration 3.0).',
      source: 'ai_type_config input_limit + FAQ ("enlarge the image by 2–3×").',
    },
  },
};

const MODE_ALIASES = {
  hd: 'HD',
  'ultra hd': 'Ultra HD', ultrahd: 'Ultra HD', 'ultra-hd': 'Ultra HD', ultra: 'Ultra HD',
  uhdu: 'AI UHD', uhd: 'AI UHD', aiuhd: 'AI UHD', 'ai uhd': 'AI UHD', 'ai-uhd': 'AI UHD',
};

function normalizeMode(m) {
  if (!m) return null;
  const key = String(m).trim().toLowerCase();
  if (MODE_ALIASES[key]) return MODES[MODE_ALIASES[key]];
  if (MODE_ALIASES[key.replace(/\s+/g, ' ')]) return MODES[MODE_ALIASES[key.replace(/\s+/g, ' ')]];
  for (const id of Object.keys(MODES)) if (id.toLowerCase() === key) return MODES[id];
  return null;
}

// ===========================================================================
// UTILITAS
// ===========================================================================
const C = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m' };
const bold = (s) => C.bold + s + C.reset;
const dim = (s) => C.dim + s + C.reset;
const green = (s) => C.green + s + C.reset;
const yellow = (s) => C.yellow + s + C.reset;
const red = (s) => C.red + s + C.reset;
const cyan = (s) => C.cyan + s + C.reset;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&gt;/g, '>').replace(/&lt;/g, '<')
    .replace(/\s+/g, ' ').trim();
}

function humanBytes(n) {
  if (n === null || n === undefined) return null;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function extForFormat(fmt) {
  return { JPEG: '.jpg', PNG: '.png', WEBP: '.webp', GIF: '.gif', BMP: '.bmp' }[fmt] || '.jpg';
}

function parseJsonMaybe(x) {
  if (typeof x === 'object' && x !== null) return x;
  try { return JSON.parse(x); } catch (_) { return null; }
}

// ===========================================================================
// HTTP (axios) dengan timeout + retry + validasi status
// ===========================================================================
function cookieHeaderFrom(opts) {
  if (opts.cookie) return opts.cookie;
  if (opts.cookieFile) {
    try {
      const raw = fs.readFileSync(opts.cookieFile, 'utf8');
      // Terima format: file cookie hasil export, atau "k=v; k2=v2"
      if (/^[^\s]+\t/.test(raw) || raw.includes('\t')) {
        const parts = [];
        for (const line of raw.split('\n')) {
          const c = line.trim();
          if (!c || c.startsWith('#')) continue;
          const f = c.split('\t');
          if (f.length >= 7) parts.push(f[5] + '=' + f[6]);
        }
        return parts.join('; ');
      }
      return raw.trim();
    } catch (e) {
      throw new Error('Gagal membaca --cookie-file: ' + e.message);
    }
  }
  if (process.env.WINK_COOKIE) return process.env.WINK_COOKIE;
  return null;
}

function accessTokenFrom(opts) {
  if (opts.token) return opts.token;
  if (process.env.WINK_ACCESS_TOKEN) return process.env.WINK_ACCESS_TOKEN;
  const ck = cookieHeaderFrom(opts);
  if (ck) {
    const m = ck.match(/(?:^|;\s*)__mt_access_token__=([^;]+)/) || ck.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

function buildHeaders(opts) {
  const h = {
    'User-Agent': DEFAULTS.userAgent,
    'Accept-Language': DEFAULTS.acceptLanguage,
    Accept: 'application/json, text/plain, */*',
    Origin: BASE,
    Referer: DEFAULTS.uploadPage,
  };
  const cookie = cookieHeaderFrom(opts);
  if (cookie) h.Cookie = cookie;
  const token = accessTokenFrom(opts);
  if (token) h['Access-Token'] = token;
  return h;
}

async function req(method, url, { data, params, headers, responseType, timeout, retries, maxRedirects } = {}, opts = {}) {
  const attempts = retries !== undefined ? retries : (opts.retries !== undefined ? opts.retries : DEFAULTS.retries);
  let lastErr;
  for (let a = 0; a <= attempts; a++) {
    try {
      const res = await axios({
        method,
        url: /^https?:\/\//.test(url) ? url : BASE + url,
        data,
        params,
        headers: Object.assign(buildHeaders(opts), headers || {}),
        responseType: responseType || 'json',
        timeout: timeout || opts.timeout || DEFAULTS.timeout,
        maxRedirects: maxRedirects !== undefined ? maxRedirects : DEFAULTS.maxRedirects,
        validateStatus: () => true,
        transformResponse: [(d) => d], // agar bisa fallback parse manual
      });
      return res;
    } catch (e) {
      lastErr = e;
      const retriable = !e.response || e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || /timeout/i.test(e.message || '');
      if (a < attempts && retriable) await sleep(400 * Math.pow(2, a));
      else if (a < attempts) await sleep(400 * Math.pow(2, a));
    }
  }
  throw lastErr;
}

// ===========================================================================
// ANALISA GAMBAR (dimensi, ukuran, ketajaman) — dipakai mode --test & verifikasi
// ===========================================================================
function detectFormat(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'JPEG';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'PNG';
  if (buf.slice(0, 3).toString('ascii') === 'GIF') return 'GIF';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'WEBP';
  if (buf[0] === 0x42 && buf[1] === 0x4d) return 'BMP';
  return null;
}

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) break;
    i += 2 + len;
  }
  return { width: null, height: null };
}

function dimensions(buf, fmt) {
  try {
    if (fmt === 'PNG') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    if (fmt === 'GIF') return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    if (fmt === 'BMP') return { width: buf.readInt32LE(18), height: Math.abs(buf.readInt32LE(22)) };
    if (fmt === 'JPEG') return jpegSize(buf);
    if (fmt === 'WEBP') {
      const t = buf.slice(12, 16).toString('ascii');
      if (t === 'VP8X') return { width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)), height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)) };
      if (t === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      if (t === 'VP8L') { const b = buf.readUInt32LE(21); return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }; }
    }
  } catch (_) {}
  return { width: null, height: null };
}

function decodePng(buf) {
  let pos = 8, width, height, bitDepth, colorType;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 6 ? 4 : 0;
  if (bitDepth !== 8 || !channels) throw new Error('PNG tidak didukung (bitDepth=' + bitDepth + ', colorType=' + colorType + ')');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.slice(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
      cur[x] = v;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { width, height, channels, data: out };
}

function grayscale(img) {
  const { width, height, channels, data } = img;
  const g = new Float64Array(width * height);
  for (let i = 0, p = 0; i < g.length; i++, p += channels) {
    g[i] = channels >= 3 ? 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2] : data[p];
  }
  return g;
}

function laplacianVariance(img) {
  const g = grayscale(img);
  const w = img.width, h = img.height;
  if (w < 3 || h < 3) return 0;
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 1500000)));
  const k = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  let s = 0, s2 = 0, n = 0;
  for (let y = 1; y < h - 1; y += step) {
    for (let x = 1; x < w - 1; x += step) {
      let acc = 0, ki = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) acc += g[(y + dy) * w + (x + dx)] * k[ki++];
      s += acc; s2 += acc * acc; n++;
    }
  }
  const mean = n ? s / n : 0;
  return n ? Math.max(0, s2 / n - mean * mean) : 0;
}

function analyzeImageBuffer(buf, contentType) {
  const fmt = detectFormat(buf);
  const dim = dimensions(buf, fmt);
  const info = {
    format: fmt,
    width: dim.width,
    height: dim.height,
    megapixels: dim.width && dim.height ? +((dim.width * dim.height) / 1e6).toFixed(2) : null,
    bytes: buf.length,
    size_human: humanBytes(buf.length),
    content_type: contentType || null,
    sharpness_laplacian_variance: null,
    is_blurry: null,
  };
  try {
    if (fmt === 'JPEG' && jpegJs) {
      const dec = jpegJs.decode(buf, { useTArray: true, maxMemoryUsageInMB: 512 });
      info.sharpness_laplacian_variance = +laplacianVariance({ width: dec.width, height: dec.height, channels: 4, data: dec.data }).toFixed(2);
    } else if (fmt === 'PNG') {
      const dec = decodePng(buf);
      info.sharpness_laplacian_variance = +laplacianVariance(dec).toFixed(2);
    }
  } catch (e) {
    info.pixel_analysis_error = e.message;
  }
  if (info.sharpness_laplacian_variance != null) info.is_blurry = info.sharpness_laplacian_variance < 50;
  return info;
}

// ===========================================================================
// MODE 1 — SCRAPE METADATA (PUBLIK, terverifikasi)
// ===========================================================================
async function fetchAiTypeConfig(opts) {
  const url = ENDPOINTS.aiTypeConfig;
  const res = await req('GET', url, { params: clientParams(), timeout: opts.timeout, retries: opts.retries }, opts);
  const body = parseJsonMaybe(res.data) || parseJsonMaybe(res.data && res.data.toString());
  return { status: res.status, body };
}

function findHowTo(blocks) {
  const steps = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'HowToStep') steps.push({ step: node.position || steps.length + 1, name: stripHtml(node.name), description: stripHtml(node.text) });
    if (Array.isArray(node.itemListElement)) node.itemListElement.forEach(walk);
    if (Array.isArray(node['@graph'])) node['@graph'].forEach(walk);
  };
  blocks.forEach(walk);
  return steps.sort((a, b) => a.step - b.step);
}

function findFaq(blocks) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'Question' && node.name) out.push({ question: stripHtml(node.name), answer: node.acceptedAnswer ? stripHtml(node.acceptedAnswer.text || node.acceptedAnswer) : null });
    const g = node['@graph'] || node.mainEntity;
    if (Array.isArray(g)) g.forEach(walk);
  };
  blocks.forEach(walk);
  return out;
}

function findWebsite(blocks) {
  const walk = (n) => {
    if (!n || typeof n !== 'object') return null;
    if (n['@type'] === 'WebSite') return n;
    if (Array.isArray(n['@graph'])) { for (const x of n['@graph']) { const r = walk(x); if (r) return r; } }
    return null;
  };
  for (const b of blocks) { const r = walk(b); if (r) return r; }
  return null;
}

function extractFeatureSections($) {
  const sections = [];
  $('.pseo__feature-item').each((i, el) => {
    const title = $(el).find('h2, h3').first().text().replace(/\s+/g, ' ').trim();
    const desc = $(el).find('p').map((j, p) => stripHtml($(p).text())).get().filter(Boolean).join(' ');
    if (title) sections.push({ title, description: desc || null });
  });
  return sections;
}

function modeFromConfig(cfg, mode) {
  // func_id dipakai bersama oleh varian VIDEO (content_type 2) dan IMAGE
  // (content_type 1); kita ambil varian gambar saja.
  const list = (cfg && Array.isArray(cfg.data)) ? cfg.data : [];
  const item =
    list.find((x) => x.func_id === mode.functionId && x.content_type === 1) ||
    list.find((x) => x.type === mode.functionType && x.content_type === 1) ||
    null;
  if (!item) return null;
  const f = item.input_limit || {};
  const o = item.output_format || {};
  return {
    id: mode.id,
    name: mode.name,
    zh_name: item.name,
    subscribe_name: item.subscribe_name || null,
    function_id: mode.functionId,
    function_type: item.type,
    material_id: mode.materialId,
    variant: mode.variant,
    task_type: item.task_type,
    content_type: item.content_type,
    tier: mode.useNeedVip ? 'premium' : 'free',
    use_need_vip: item.use_need_vip,
    beans: item.beans,
    vip_beans: item.vip_beans,
    ext_value: item.ext_value != null ? item.ext_value : mode.extValue,
    description: mode.description,
    resolution: mode.resolution || null,
    input: {
      formats: f.formats || null,
      max_size_bytes: f.max_size_bytes != null ? f.max_size_bytes : null,
      max_size_human: f.max_size_bytes != null ? humanBytes(f.max_size_bytes) : null,
      max_long_edge: f.max_long_edge != null ? f.max_long_edge : null,
      max_short_edge: f.max_short_edge != null ? f.max_short_edge : null,
      modes: f.modes || null,
    },
    output: {
      formats: o.formats || null,
      fixed_width: o.width || 0,
      fixed_height: o.height || 0,
      long_edge: o.long_edge || 0,
      short_edge: o.short_edge || 0,
    },
    processing: {
      min_time_s: item.min_time,
      max_time_s: item.max_time,
      max_time_normal_s: item.max_time_normal,
      second_step_s: item.second_step,
      is_local_process: item.is_local_process,
    },
  };
}

async function scrapeMetadata(opts) {
  const url = opts.page || DEFAULTS.page;
  const resHtml = await req('GET', url, { responseType: 'text', timeout: opts.timeout, retries: opts.retries }, opts);
  const status = resHtml.status;
  const html = typeof resHtml.data === 'string' ? resHtml.data : String(resHtml.data || '');
  if (status >= 400) throw new Error('HTTP ' + status + ' saat mengambil ' + url);
  if (!html || html.length < 500) throw new Error('Konten halaman kosong/terlalu pendek (' + html.length + ' byte)');

  const $ = cheerio.load(html);
  const blocks = [];
  $('script[type="application/ld+json"]').each((i, el) => { try { blocks.push(JSON.parse($(el).contents().text())); } catch (_) {} });
  const faq = findFaq(blocks);
  const processSteps = findHowTo(blocks);
  const website = findWebsite(blocks);

  let cfg = { ok: false, status: null, body: null };
  try { cfg = Object.assign({ ok: true }, await fetchAiTypeConfig(opts)); }
  catch (e) { cfg.error = e.message; }

  const modes = {};
  for (const key of Object.keys(MODES)) {
    const m = MODES[key];
    modes[key] = modeFromConfig(cfg.body, m) || {
      id: m.id, name: m.name, function_id: m.functionId, function_type: m.functionType,
      material_id: m.materialId, variant: m.variant, tier: m.tier, description: m.description,
      note: 'Detail input/output tidak tersedia dari ai_type_config (fetch gagal?).',
    };
  }

  const title = $('title').first().text().trim() || null;
  const description = $('meta[name="description"]').attr('content') || null;
  const canonical = $('link[rel="canonical"]').attr('href') || null;
  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDesc = $('meta[property="og:description"]').attr('content') || null;

  const related = [];
  $('a').each((i, el) => {
    const h3 = $(el).find('h3').first();
    const t = h3.length ? h3.text().replace(/\s+/g, ' ').trim() : '';
    const href = $(el).attr('href');
    if (t && href && !/^(#|mailto:|javascript:)/.test(href)) {
      const u = href.startsWith('http') ? href : BASE + (href.startsWith('/') ? href : '/' + href);
      if (!related.some((x) => x.url === u)) related.push({ title: t, url: u });
    }
  });

  return {
    ok: true,
    scraped_at: new Date().toISOString(),
    source: {
      site: BASE,
      feature_page: url,
      canonical,
      official_url: BASE + '/image-enhancer',
      upload_url: DEFAULTS.uploadPage,
      http_status: status,
      method: 'axios + cheerio + endpoint publik /api/meitu_ai/ai_type_config.json',
    },
    feature: {
      name: 'Wink AI Image Enhancer',
      title, og_title: ogTitle,
      description, og_description: ogDesc,
      publisher: website && website.name ? website.name : null,
    },
    modes,
    mode_differences: [
      { aspect: 'Tingkat restorasi', HD: 'Penajaman & kejernihan standar', 'Ultra HD': 'Restorasi + penajaman (rekomendasi umum)', 'AI UHD': 'Advanced Restoration 3.0 (AI mengisi detail)' },
      { aspect: 'Perbesaran (upscale)', HD: 'Upscale ke HD', 'Ultra HD': 'Upscale hingga Ultra HD/4K', 'AI UHD': '≈2–3× dari input' },
      { aspect: 'Biaya (beans)', HD: '2', 'Ultra HD': '4', 'AI UHD': '8 (butuh VIP)' },
      { aspect: 'format_id', HD: '63090', 'Ultra HD': '63091', 'AI UHD': '63093' },
    ],
    supported_formats: { formats: ['jpg', 'jpeg', 'jpe', 'png', 'bmp'], output_formats: ['jpg', 'png'] },
    file_limits: { max_size_bytes: 31457280, max_size_human: '30 MB', max_long_edge: 7999, max_short_edge: 7999, note: 'Nilai dari ai_type_config input_limit (mode HD/Ultra HD/AI UHD).' },
    process: { steps: processSteps, summary: 'Unggah gambar -> pilih mode (HD / Ultra HD / AI UHD) -> proses -> lihat hasil -> unduh.' },
    faq,
    feature_sections: extractFeatureSections($),
    related_features: opts.related ? related : related.slice(0, 12),
    endpoints: ENDPOINTS,
    mode_function_map: { HD: 63090, 'Ultra HD': 63091, 'Portrait Enhance': 63092, 'AI UHD': 63093, Pro: 63100, AIGC: 63101 },
    counts: { faq: faq.length, process_steps: processSteps.length, related_features: related.length, ai_type_config_items: cfg.body && Array.isArray(cfg.body.data) ? cfg.body.data.length : 0 },
    ai_type_config_ok: cfg.ok,
    ai_type_config_error: cfg.error || null,
  };
}

// ===========================================================================
// MODE 2 — TEST KUALITAS (tanpa login)
// ===========================================================================
async function loadSource(opts) {
  if (opts.file) {
    if (!fs.existsSync(opts.file)) throw new Error('File tidak ditemukan: ' + opts.file);
    const buf = fs.readFileSync(opts.file);
    return { buf, name: path.basename(opts.file), source: 'file:' + path.resolve(opts.file), contentType: null };
  }
  if (opts.imageUrl) {
    const res = await req('GET', opts.imageUrl, { responseType: 'arraybuffer', headers: { Accept: 'image/*,*/*' }, timeout: opts.timeout, retries: opts.retries }, opts);
    if (res.status >= 400) throw new Error('HTTP ' + res.status + ' saat mengunduh gambar: ' + opts.imageUrl);
    const buf = Buffer.from(res.data);
    const ct = res.headers['content-type'] || null;
    let name = 'image';
    try { name = path.basename(new URL(opts.imageUrl).pathname) || 'image'; } catch (_) {}
    return { buf, name, source: opts.imageUrl, contentType: ct };
  }
  throw new Error('Sumber gambar tidak diberikan (url atau --file).');
}

async function qualityTest(opts, mode) {
  const src = await loadSource(opts);
  const info = analyzeImageBuffer(src.buf, src.contentType);
  const blurry = info.sharpness_laplacian_variance != null && info.sharpness_laplacian_variance < 50;
  const lowRes = (info.width || 0) < 1280 || (info.height || 0) < 720;
  const veryLowRes = (info.width || 0) < 640 || (info.height || 0) < 480;
  let rec = veryLowRes || blurry ? 'AI UHD' : lowRes ? 'Ultra HD' : 'HD';
  return {
    ok: !!info.format,
    mode: 'quality_test',
    method: opts.file ? 'LOCAL' : 'GET',
    request: { source: src.source, selected_mode: mode ? mode.id : null },
    image: info,
    recommendation: {
      recommended_mode: rec,
      reasons: [
        veryLowRes ? 'Resolusi sangat rendah (<640×480).' : lowRes ? 'Resolusi di bawah HD.' : 'Resolusi memadai.',
        blurry ? 'Gambar cenderung buram (Laplacian variance < 50).' : 'Ketajaman memadai.',
      ],
      flag_match: mode ? mode.id === rec : null,
    },
    note: 'Analisa lokal pada gambar yang diunduh. Tidak memanggil API enhancer privat Wink.',
  };
}

// ===========================================================================
// MODE 3 — ENHANCE (butuh login). Upload -> create task -> polling -> download
// ===========================================================================
function pickUrlDeep(obj, depth) {
  if (depth === undefined) depth = 0;
  if (obj == null || depth > 6) return null;
  if (typeof obj === 'string') return /^https?:\/\//.test(obj) ? obj : null;
  if (Array.isArray(obj)) { for (const x of obj) { const r = pickUrlDeep(x, depth + 1); if (r) return r; } return null; }
  if (typeof obj === 'object') {
    const prefer = ['url', 'result_url', 'resultUrl', 'media_url', 'mediaUrl', 'download_url', 'downloadUrl', 'file_url', 'fileUrl', 'src', 'output_url', 'output'];
    for (const k of prefer) if (obj[k] && typeof obj[k] === 'string' && /^https?:\/\//.test(obj[k])) return obj[k];
    for (const k of Object.keys(obj)) { const r = pickUrlDeep(obj[k], depth + 1); if (r) return r; }
  }
  return null;
}

function deepFind(obj, keys, depth) {
  if (depth === undefined) depth = 0;
  if (obj == null || depth > 8) return undefined;
  if (typeof obj !== 'object') return undefined;
  for (const k of keys) if (obj[k] !== undefined) return obj[k];
  for (const k of Object.keys(obj)) { const r = deepFind(obj[k], keys, depth + 1); if (r !== undefined) return r; }
  return undefined;
}

function assertApiOk(body, stage) {
  if (!body || typeof body !== 'object') throw new Error(stage + ': respons bukan JSON yang bisa dibaca.');
  if (body.code === undefined && body.errcode === undefined && body.meta === undefined && body.data === undefined) return;
  const code = body.code !== undefined ? body.code : (body.errcode !== undefined ? body.errcode : (body.meta ? body.meta.code : undefined));
  const okCodes = [0, 1, 200, 20000];
  if (code !== undefined && !okCodes.includes(code)) {
    const msg = body.message || body.msg || (body.meta && body.meta.msg) || JSON.stringify(body).slice(0, 200);
    const err = new Error(stage + ': server menolak [' + code + '] ' + msg);
    err.api = { code, message: msg };
    if (code === 10111 || /登录|login/i.test(String(msg))) {
      err.hint = 'Endpoint ini butuh LOGIN. Pasok sesi Anda: --cookie="__mt_access_token__=...; __mt_uid__=..." (atau --cookie-file / env WINK_COOKIE / --token).';
    }
    throw err;
  }
}

async function uploadImage(src, opts) {
  // /api/v1/upload : multipart, field "media" (file) atau "media_url" (url).
  const form = new FormData();
  if (src.buf) {
    const fmt = detectFormat(src.buf) || 'JPEG';
    const ext = extForFormat(fmt);
    const name = /\.(jpe?g|png|webp|gif|bmp)$/i.test(src.name) ? src.name : (src.name || 'image') + ext;
    form.append('media', new Blob([src.buf]), name);
  } else {
    form.append('media_url', src.source);
  }
  const res = await req('POST', ENDPOINTS.upload, { data: form, timeout: Math.max(opts.timeout, 60000), retries: opts.retries }, opts);
  const body = parseJsonMaybe(res.data);
  if (opts.debug) console.error(dim('[debug] upload response: ' + JSON.stringify(body).slice(0, 800)));
  assertApiOk(body, 'upload');
  const url = (body && (pickUrlDeep(body.data) || pickUrlDeep(body))) || null;
  if (!url) {
    const e = new Error('upload: berhasil dikirim tetapi URL media tidak ditemukan di respons. Respons: ' + JSON.stringify(body).slice(0, 400));
    e.debug = body;
    throw e;
  }
  return { url, response: body };
}

async function createTask(src, uploadedUrl, mode, opts) {
  // Strategi grup task: /api/meitu_ai_task_group/create_and_delivery.json
  // skema ditemukan: { taskType, name, clientExtParams, subtaskList:[{...}], withPrepare }
  const now = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = now.getFullYear() + p(now.getMonth() + 1) + p(now.getDate()) + '-' + p(now.getHours()) + p(now.getMinutes()) + p(now.getSeconds());

  const meta = analyzeImageBuffer(src.buf, src.contentType);
  const subtask = {
    functionId: mode.functionId,
    function_id: mode.functionId,
    type: mode.functionType,
    taskType: mode.taskType,
    content_type: 1,
    extValue: mode.extValue,
    materialId: mode.materialId,
    sourceFile: {
      url: uploadedUrl,
      width: meta.width || 0,
      height: meta.height || 0,
      size: src.buf ? src.buf.length : 0,
      mediaType: 'image',
      contentType: 1,
    },
    url: uploadedUrl,
    typeParams: {},
    extParams: { fromExportpage: 0 },
  };
  const payload = {
    taskType: mode.taskType,
    name: 'ImageEnhancer-' + mode.id.replace(/\s+/g, '') + '-' + stamp,
    clientExtParams: {},
    subtaskList: [subtask],
    withPrepare: 0,
  };

  const res = await req('POST', ENDPOINTS.createDeliveryGroup, { data: payload, timeout: opts.timeout, retries: opts.retries, headers: { 'Content-Type': 'application/json' } }, opts);
  const body = parseJsonMaybe(res.data);
  if (opts.debug) console.error(dim('[debug] create response: ' + JSON.stringify(body).slice(0, 1200)));
  assertApiOk(body, 'create');

  const taskId = deepFind(body, ['msgId', 'taskId', 'task_id', 'id', 'msg_id']);
  const groupId = deepFind(body, ['group_id', 'groupId', 'groupID']) || taskId;
  return { taskId, groupId, response: body, request: payload };
}

async function pollTask(ids, opts) {
  const deadline = Date.now() + (opts.maxWait || DEFAULTS.maxWait);
  const interval = opts.pollInterval || DEFAULTS.pollInterval;
  const wantId = ids.taskId;
  let last = null;
  while (Date.now() < deadline) {
    await sleep(interval);
    let body = null;
    try {
      // 1) query task feed by msgIds (paling langsung)
      if (wantId) {
        const r = await req('GET', ENDPOINTS.queryBatch, { params: clientParams({ msgIds: String(wantId) }), timeout: opts.timeout, retries: 1 }, opts);
        body = parseJsonMaybe(r.data);
      }
      // 2) fallback: task group list by groupIds
      if ((!body || !body.data) && ids.groupId) {
        const r2 = await req('GET', ENDPOINTS.taskGroupList, { params: clientParams({ groupIds: String(ids.groupId) }), timeout: opts.timeout, retries: 1 }, opts);
        body = parseJsonMaybe(r2.data);
      }
    } catch (e) {
      last = { error: e.message };
      continue;
    }
    last = body;
    if (opts.debug) console.error(dim('[debug] poll: ' + JSON.stringify(body).slice(0, 500)));

    // cari status & result URL
    const url = pickUrlDeep(body && body.data);
    const statusRaw = deepFind(body, ['status', 'taskStatus', 'task_status', 'state', 'processStatus']);
    const statusNum = typeof statusRaw === 'number' ? statusRaw : undefined;
    // 0/1 = pending/doing, 2 = done, 3 = error (umum di API Meitu)
    const done = url || statusNum === 2 || statusNum === 3 || /done|success|finish|complete|error|fail/i.test(String(statusRaw));
    if (done) {
      const isError = statusNum === 3 || /error|fail/i.test(String(statusRaw)) || (!url && /error|fail/i.test(JSON.stringify(body).slice(0, 500)));
      return { finished: true, failed: isError, status: statusRaw, result_url: url, raw: body };
    }
  }
  return { finished: false, failed: false, status: 'timeout', result_url: pickUrlDeep(last && last.data), raw: last };
}

async function enhance(opts, mode) {
  const started = Date.now();
  const accessTokenFromRes = accessTokenFrom(opts);
  const cookie = cookieHeaderFrom(opts);
  if (!accessTokenFromRes && !cookie) {
    const err = new Error(
      'Mode enhance butuh sesi login Wink yang valid, tetapi tidak ada cookie/token yang diberikan.\n' +
      '  Endpoint task Wink melindungi semua operasi dengan login (server balas code 10111).\n' +
      '  Pasokan sesi Anda, misalnya:\n' +
      '    node scrape-wink.js "' + (opts.imageUrl || opts.file || '<gambar>') + '" --' + (mode ? mode.id : 'UHD') + ' \\\n' +
      '      --cookie="__mt_access_token__=XXX; __mt_uid__=123; __mt_client_id__=' + CLIENT_ID + '"\n' +
      '  atau gunakan env WINK_COOKIE / --cookie-file=cookies.txt / --token=<access-token>.'
    );
    err.code = 'NO_AUTH';
    throw err;
  }

  const result = {
    ok: false,
    action: 'enhance',
    mode: mode.id,
    function_id: mode.functionId,
    pipelined: true,
    stages: {},
    original: null,
    result: null,
    task_id: null,
    group_id: null,
    status: null,
    result_url: null,
    output_file: null,
    error: null,
    elapsed_ms: 0,
  };

  const src = await loadSource(opts);
  const orig = analyzeImageBuffer(src.buf, src.contentType);
  result.original = orig;
  result.stages.load = { ok: true, source: src.source, width: orig.width, height: orig.height, bytes: orig.bytes, format: orig.format };

  // Tahap 1: upload
  let up;
  try {
    up = await uploadImage(src, opts);
    result.stages.upload = { ok: true, media_url: up.url };
  } catch (e) {
    result.stages.upload = { ok: false, error: e.message, hint: e.hint || null };
    result.error = 'UPLOAD gagal: ' + e.message;
    result.elapsed_ms = Date.now() - started;
    return result;
  }

  // Tahap 2: create task
  let task;
  try {
    task = await createTask(src, up.url, mode, opts);
    result.task_id = task.taskId != null ? task.taskId : null;
    result.group_id = task.groupId != null ? task.groupId : null;
    result.stages.create = { ok: true, request: task.request, response_summary: JSON.stringify(task.response).slice(0, 800) };
  } catch (e) {
    result.stages.create = { ok: false, error: e.message, hint: e.hint || null, api: e.api || null };
    result.error = 'CREATE TASK gagal: ' + e.message;
    result.elapsed_ms = Date.now() - started;
    return result;
  }

  // Tahap 3: polling
  let poll;
  try {
    poll = await pollTask({ taskId: result.task_id, groupId: result.group_id }, opts);
    result.status = poll.status;
    result.result_url = poll.result_url || null;
    result.stages.poll = { ok: poll.finished && !poll.failed, finished: poll.finished, failed: poll.failed, status: poll.status, result_url: poll.result_url || null };
  } catch (e) {
    result.stages.poll = { ok: false, error: e.message };
    result.error = 'POLLING gagal: ' + e.message;
    result.elapsed_ms = Date.now() - started;
    return result;
  }

  if (!poll.result_url) {
    result.error = poll.finished
      ? (poll.failed ? 'Proses di server gagal (status error).' : 'Selesai tetapi URL hasil tidak ditemukan.')
      : 'Timeout menunggu hasil (max-wait ' + (opts.maxWait) + ' ms).';
    result.elapsed_ms = Date.now() - started;
    return result;
  }

  // Tahap 4: download hasil
  try {
    const outDir = opts.outDir || DEFAULTS.outDir;
    fs.mkdirSync(outDir, { recursive: true });
    const baseName = (src.name || 'image').replace(/\.[^.]+$/, '') || 'image';
    const dl = await req('GET', poll.result_url, { responseType: 'arraybuffer', headers: { Accept: 'image/*,*/*' }, timeout: Math.max(opts.timeout, 60000), retries: opts.retries }, opts);
    if (dl.status >= 400) throw new Error('HTTP ' + dl.status);
    const outBuf = Buffer.from(dl.data);
    const fmt = detectFormat(outBuf) || (orig.format === 'PNG' ? 'PNG' : 'JPEG');
    const outFile = path.join(outDir, baseName + '_' + mode.slug + extForFormat(fmt));
    fs.writeFileSync(outFile, outBuf);
    const rMeta = analyzeImageBuffer(outBuf, dl.headers['content-type']);
    result.result = rMeta;
    result.output_file = path.resolve(outFile);
    result.stages.download = { ok: true, output_file: path.resolve(outFile), bytes: outBuf.length };
    result.ok = true;
  } catch (e) {
    result.stages.download = { ok: false, error: e.message };
    result.error = 'DOWNLOAD gagal: ' + e.message;
  }

  result.elapsed_ms = Date.now() - started;
  return result;
}

// ===========================================================================
// CLI
// ===========================================================================
function parseArgs(argv) {
  const opts = {
    page: null, imageUrl: null, file: null, mode: null,
    action: null, test: false, related: false, json: false, debug: false, help: false,
    out: DEFAULTS.out, outExplicit: false, outDir: DEFAULTS.outDir,
    retries: DEFAULTS.retries, timeout: DEFAULTS.timeout,
    pollInterval: DEFAULTS.pollInterval, maxWait: DEFAULTS.maxWait,
    cookie: null, cookieFile: null, token: null,
  };
  const words = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--test' || a === '--quality-test') opts.test = true;
    else if (a === '--enhance') opts.action = 'enhance';
    else if (a === '--scrape') opts.action = 'scrape';
    else if (a === '--related') opts.related = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--debug') opts.debug = true;
    else if (a.startsWith('--out=')) { opts.out = a.slice(6); opts.outExplicit = true; }
    else if (a.startsWith('--out-dir=')) opts.outDir = a.slice(10);
    else if (a.startsWith('--file=')) opts.file = a.slice(7);
    else if (a.startsWith('--url=')) opts.page = a.slice(6);
    else if (a.startsWith('--retries=')) opts.retries = parseInt(a.slice(10), 10);
    else if (a.startsWith('--timeout=')) opts.timeout = parseInt(a.slice(10), 10);
    else if (a.startsWith('--poll-interval=')) opts.pollInterval = parseInt(a.slice(16), 10);
    else if (a.startsWith('--max-wait=')) opts.maxWait = parseInt(a.slice(11), 10);
    else if (a.startsWith('--cookie=')) opts.cookie = a.slice(9);
    else if (a.startsWith('--cookie-file=')) opts.cookieFile = a.slice(14);
    else if (a.startsWith('--token=')) opts.token = a.slice(8);
    else if (a.startsWith('--endpoint=')) { /* dipertahankan utk kompatibilitas; diabaikan */ }
    else if (a.startsWith('--mode=')) opts.mode = a.slice(7);
    else if (a === '--mode') opts.mode = argv[++i];
    else if (a === '--Ultra') { opts.mode = 'Ultra HD'; if (/^HD$/i.test(argv[i + 1] || '')) i++; }
    else if (a === '--AI') { opts.mode = 'AI UHD'; if (/^UHD$/i.test(argv[i + 1] || '')) i++; }
    else if (/^--(HD|Ultra[- ]?HD|UHD|AI[- ]?UHD|ultrahd|aiuhd)$/i.test(a)) opts.mode = a.slice(2);
    else if (a.startsWith('--')) continue;
    else words.push(a);
  }
  const urlWord = words.find((w) => /^https?:\/\//i.test(w));
  if (urlWord) opts.imageUrl = urlWord;
  else if (words[0] && !opts.file) {
    if (/^https?:\/\//i.test(words[0])) opts.imageUrl = words[0];
    else opts.file = words[0];
  }
  if (!opts.mode) {
    const rest = words.filter((w) => w !== urlWord).join(' ');
    const m = normalizeMode(rest) || normalizeMode(words.slice(1).join(' '));
    if (m) opts.mode = m.id;
  }
  return opts;
}

function usage() {
  console.log(bold('scrape-wink.js — Wink AI Image Enhancer (scrape metadata + enhance/test gambar)'));
  console.log('');
  console.log(bold('1) Scrape metadata fitur (default, tidak perlu login):'));
  console.log('   ' + cyan('node scrape-wink.js') + dim('   # -> wink-image-enhancer.json'));
  console.log('   ' + cyan('node scrape-wink.js --scrape --related'));
  console.log('');
  console.log(bold('2) Enhance gambar (HD / Ultra HD / AI UHD) — BUTUH LOGIN:'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --HD'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --Ultra HD'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --UHD'));
  console.log('   ' + cyan('node scrape-wink.js --file=foto.jpg --UHD --out-dir=output'));
  console.log('   ' + dim('   (sertakan --cookie="__mt_access_token__=...; __mt_uid__=..." atau env WINK_COOKIE)'));
  console.log('');
  console.log(bold('3) Uji kualitas gambar saja (tanpa login):'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --HD --test'));
  console.log('   ' + cyan('node scrape-wink.js --file=foto.jpg --UHD --test'));
  console.log('');
  console.log('Opsi: ' + dim('--out=file.json  --out-dir=./output  --timeout=30000  --retries=3'));
  console.log('      ' + dim('--poll-interval=3000  --max-wait=300000  --cookie=..  --cookie-file=..  --token=..'));
  console.log('      ' + dim('--related  --json  --debug'));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { usage(); return; }

  const isImageAction = !!(opts.file || opts.imageUrl);
  const action = opts.action || (isImageAction ? (opts.test ? 'test' : 'enhance') : 'scrape');

  if (action === 'scrape') {
    console.error(dim('[i] Scraping metadata: ' + (opts.page || DEFAULTS.page)));
    const data = await scrapeMetadata(opts);
    const json = JSON.stringify(data, null, 2);
    console.log(json);
    try { fs.writeFileSync(opts.out, json); console.error(dim('[i] Disimpan ke: ' + path.resolve(opts.out))); }
    catch (e) { console.error(yellow('[!] Gagal menulis file: ' + e.message)); }
    return;
  }

  const mode = normalizeMode(opts.mode) || (opts.mode ? null : normalizeMode('Ultra HD'));
  if (opts.mode && !mode) {
    const err = new Error('Mode tidak dikenal: "' + opts.mode + '". Gunakan: HD | Ultra HD | UHD (AI UHD).');
    console.error(red('[FATAL] ' + err.message));
    if (opts.json) console.log(JSON.stringify({ ok: false, error: err.message }, null, 2));
    process.exitCode = 2;
    return;
  }

  if (action === 'test') {
    const data = await qualityTest(opts, mode);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  // action === 'enhance'
  console.error(dim('[i] Mode enhance: ' + (mode ? mode.id : 'Ultra HD') + ' (functionId ' + (mode || MODES['Ultra HD']).functionId + ')'));
  const data = await enhance(opts, mode || MODES['Ultra HD']);
  console.log(JSON.stringify(data, null, 2));

  // JSON ringkas (field yang diminta) ke file default di outDir
  try {
    const summary = {
      ok: data.ok,
      mode: data.mode,
      function_id: data.function_id,
      task_id: data.task_id,
      status: data.status,
      result_url: data.result_url,
      output_file: data.output_file,
      original: data.original ? { width: data.original.width, height: data.original.height, bytes: data.original.bytes, format: data.original.format } : null,
      result: data.result ? { width: data.result.width, height: data.result.height, bytes: data.result.bytes, format: data.result.format } : null,
      error: data.error,
      elapsed_ms: data.elapsed_ms,
    };
    if (opts.outExplicit) fs.writeFileSync(opts.out, JSON.stringify(summary, null, 2));
  } catch (_) {}

  if (!data.ok) {
    console.error(red('[✗] Enhance gagal: ' + (data.error || 'unknown')));
    if (data.stages && data.stages.upload && data.stages.upload.hint) console.error(yellow('[!] ' + data.stages.upload.hint));
    process.exitCode = 1;
  } else {
    console.error(green('[✓] Selesai') + dim('  hasil: ' + data.output_file));
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(red('FATAL: ' + ((e && (e.stack || e.message)) || String(e))));
    if (process.argv.slice(2).some((a) => a === '--json')) {
      console.log(JSON.stringify({ ok: false, error: e.message, code: e.code || null }, null, 2));
    }
    process.exit(1);
  });
}

module.exports = {
  scrapeMetadata, qualityTest, enhance, normalizeMode, MODES, ENDPOINTS,
  detectFormat, dimensions, analyzeImageBuffer, parseArgs, clientParams,
};