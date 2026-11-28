#!/usr/bin/env node

/**
 * Name : Instagram Downloader
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web : https://fastdl.app/
 * Type : Scraper
 * Method : POST
 * Description : Mengunduh media Instagram melalui tautan postingan, seperti video, foto, Reels, Story publik, Highlight, dan carousel. Pengguna cukup memasukkan link Instagram, lalu sistem akan memprosesnya dan menampilkan media yang tersedia untuk diunduh.
 * Note : Key/anchor hasil reverse engineering, kalau engine berubah (cookie/captcha gagal terus), kemungkinan key/anchor sudah dirotasi, harus re-extract. Axios juga langsung bisa kena HTTP 422 CAPTCHA_REQUIRED (Cloudflare Turnstile), scrape otomatis fallback ke Chromium headless. untuk Media diunduh menggunakan via proxy (Btw proxy ini TIDAK perlu captcha, bisa axios biasa). meski axios tetapi bisa juga kena captcha, karena proxy media beda jalur dengan API engine nya. Btw error fix sendiri.
 */


'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

/* ======================= Konfigurasi engine ======================= */
const API_CONVERT = 'https://api-wh.fastdl.app/api/convert';
const API_STORY = 'https://api-wh.fastdl.app/api/v2/instagram/story';
const HEADERS = {
  'content-type': 'application/json',
  origin: 'https://fastdl.app',
  referer: 'https://fastdl.app/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
};
const SIG_ANCHOR = 1792669020566;
const SIG_KEY = '9fbd641b43fa2dbe86acf8681c942b9b3de27530309b78e3064d912d1102460e';
const SIG_VERSION = 2;
const API_TIMEOUT = 35000;
const DL_TIMEOUT = 120000;
const MAX_RETRIES = 3;
const OUT_BASE = 'downloads';
const SHORT_RE = /^[A-Za-z0-9_-]{7,16}$/;

/* ------------------- Tanda tangani payload engine ------------------- */
function signPayload(payload) {
  const ts = Date.now();
  const msg = JSON.stringify(payload) + String(ts);
  const hmac = crypto.createHmac('sha256', Buffer.from(SIG_KEY, 'hex')).update(msg).digest('hex');
  return { ...payload, ts, _ts: SIG_ANCHOR, _tsc: 0, _sv: SIG_VERSION, _s: hmac };
}

/* ------------------ Validasi & identifikasi link IG ------------------ */
function parseInstagramUrl(raw) {
  let url = String(raw || '').trim();
  if (!url) throw new Error('URL kosong');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
  let u;
  try { u = new URL(url); } catch (e) { throw new Error('Bukan URL yang valid'); }
  const host = (u.hostname || '').toLowerCase().replace(/^(www|m|l)\./, '');
  if (!/(^|\.)instagram\.com$|^instagr\.am$/.test(host)) throw new Error('Bukan link Instagram (' + host + ')');
  const segs = u.pathname.split('/').filter(Boolean);
  const ki = segs.findIndex((s) => /^(p|reel|reels|tv|stories)$/i.test(s));
  if (ki === -1) throw new Error('Path tidak dikenali; butuh /p/, /reel/, /tv/ atau /stories/');
  const kind = segs[ki].toLowerCase();
  let username = null;
  let shortcode = null;
  let mediaType = 'post';
  if (kind === 'stories') {
    username = segs[ki + 1] || null;
    shortcode = segs[ki + 2] || null;
    mediaType = 'story';
    if (!username || !shortcode) throw new Error('Format story harus /stories/<username>/<storyId>/');
  } else {
    shortcode = segs[ki + 1] || null;
    if (kind === 'reel' || kind === 'reels') mediaType = 'reel';
    else if (kind === 'tv') mediaType = 'igtv';
    if (!shortcode) throw new Error('Shortcode tidak ditemukan setelah /' + kind + '/');
    if (!SHORT_RE.test(shortcode)) throw new Error('Format shortcode tidak valid: ' + shortcode);
  }
  return {
    inputRaw: url,
    host,
    processed: kind === 'stories'
      ? 'https://www.instagram.com/stories/' + username + '/' + shortcode + '/'
      : 'https://www.instagram.com/' + kind + '/' + shortcode + '/',
    isStory: kind === 'stories',
    shortcode,
    username,
    mediaType,
  };
}

/* -------------------------- HTTP util -------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class EngineError extends Error {
  constructor(msg, code, detail) {
    super(msg);
    this.code = code || 'ENGINE_ERROR';
    this.detail = detail || null;
  }
}

async function apiPost(url, payload) {
  const body = signPayload(payload);
  let res;
  try {
    res = await axios.post(url, body, { headers: HEADERS, timeout: API_TIMEOUT, validateStatus: () => true });
  } catch (e) {
    if (axios.isAxiosError(e) && (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT')) throw new EngineError('TIMEOUT engine', 'TIMEOUT');
    if (axios.isAxiosError(e)) throw new EngineError('FETCH-FAIL: ' + (e.message || e.code), 'NETWORK');
    throw e;
  }
  /* 422 CAPTCHA_REQUIRED */
  if (res.status === 422 && res.data && res.data.code === 'CAPTCHA_REQUIRED') {
    throw new EngineError('CAPTCHA_REQUIRED oleh engine (butuh turnstile)', 'CAPTCHA');
  }
  const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  let json;
  try { json = typeof res.data === 'string' ? JSON.parse(res.data) : res.data; } catch (e) {
    throw new EngineError('Respon engine bukan JSON: ' + text.slice(0, 160), 'BAD_JSON');
  }
  /* engine membalas link invalid lewat wrapper invalid_request */
  if (json && typeof json.info === 'number' && typeof json.code === 'string' && /invalid_request/.test(json.code) && !json.url) {
    const like = json.code.match(/"html":"([\s\S]*?)","invalid_request"/);
    throw new EngineError(
      'INVALID_REQUEST: ' + (like ? like[1].replace(/\\"/g, '"') : 'Link tidak valid / tidak dapat diproses'),
      'INVALID_REQUEST'
    );
  }
  if (res.status >= 500) throw new EngineError('HTTP ' + res.status + ' dari engine', 'SERVER');
  return json;
}

/* Fast-path axios */
async function callConvertAxios(processedUrl) {
  let lastErr = null;
  for (let a = 1; a <= MAX_RETRIES; a++) {
    if (a > 1) await sleep(800 * a);
    try {
      const json = await apiPost(API_CONVERT, { target_url: processedUrl });
      if (!json || !Array.isArray(json.url) || json.url.length === 0) {
        /* Mesin sukses tapi kosong: satu putaran lagi sebelum fallback browser */
        if (a === MAX_RETRIES) throw new EngineError('DATA KOSONG (axios): engine tidak mengembalikan media', 'EMPTY');
        continue;
      }
      return { json, via: 'axios-direct' };
    } catch (e) {
      lastErr = e;
      if (e instanceof EngineError && ['CAPTCHA', 'INVALID_REQUEST', 'BAD_JSON', 'EMPTY'].includes(e.code)) throw e;
    }
  }
  throw lastErr;
}

/* --------------------------- Browser engine (bypass captcha) -------------------------- */
async function engineViaBrowser(processedUrl) {
  let puppeteer = null;
  try { puppeteer = require('puppeteer-core'); } catch (e) {
    throw new EngineError('CAPTCHA_REQUIRED dan puppeteer-core tidak terpasang (npm i puppeteer-core + chromium)', 'NO_BROWSER');
  }
  const exe = process.env.CHROMIUM_PATH || ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find((p) => { try { fs.existsSync(p); return fs.existsSync(p); } catch (e) { return false; } });
  if (!exe) throw new EngineError('Chromium/Chrome tidak ditemukan pada sistem', 'NO_BROWSER');
  log('[browser] Meluncurkan engine Chromium headless (bypass CAPTCHA)...');
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 860 });
    let convertJson = null;
    let convertInvalid = null;
    page.on('response', async (res) => {
      if (res.url().includes('/api/convert') && res.request().method() === 'POST') {
        try {
          const j = await res.json();
          if (j && Array.isArray(j.url) && j.url.length) convertJson = j;
          else if (j && j.code && /invalid_request/.test(String(j.code))) convertInvalid = j;
        } catch (e) { /* abaikan */ }
      }
    });
    await page.goto('https://fastdl.app/', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('#search-form-input', { timeout: 25000 });
    await page.evaluate((u) => {
      const el = document.querySelector('#search-form-input');
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(el, u);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, processedUrl);
    await page.click('#searchFormButton');
    const startUrl = page.url();
    let navUrl = null;
    let notFound = false;
    for (let i = 0; i < 60 && !convertJson; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const cur = page.url();
      if (cur !== startUrl && cur !== 'about:blank' && !/fastdl\.app\/?$/.test(cur)) { navUrl = cur; break; }
      try {
        const hasNotFound = await page.evaluate(() => {
          const t = document.body && document.body.innerText || '';
          return /download link not found|couldn.t download this content/i.test(t);
        }).catch(() => false);
        if (hasNotFound) { notFound = true; break; }
      } catch (e) { /* diam */ }
      try {
        const box = await page.$('input[type="checkbox"]');
        if (box) { await box.click().catch(() => {}); }
      } catch (e) { /* diam */ }
    }
    if (!convertJson && convertInvalid) {
      const like = String(convertInvalid.code || '').match(/"html":"([\s\S]*?)","invalid_request"/);
      throw new EngineError('INVALID_REQUEST: ' + (like ? like[1].replace(/\\"/g, '"') : 'Link tidak valid / tidak dapat diproses'), 'INVALID_REQUEST');
    }
    if (!convertJson && notFound) {
      throw new EngineError('CONTENT_NOT_AVAILABLE: engine menandakan "download link not found" (post/story tidak tersedia, private, atau shortcode salah).', 'CONTENT_NOT_AVAILABLE', { screenshot: '/tmp/igdl-browser-state.png' });
    }
    if (!convertJson && navUrl) {
      try { await page.screenshot({ path: '/tmp/igdl-browser-state.png' }); } catch (e) { /* diam */ }
      throw new EngineError('CONTENT_NOT_AVAILABLE: engine menandakan konten tidak dapat diunduh / media tidak tersedia', 'CONTENT_NOT_AVAILABLE', { final_url: navUrl, screenshot: '/tmp/igdl-browser-state.png' });
    }
    if (!convertJson) {
      /* screenshot untuk diagnosis */
      try { await page.screenshot({ path: '/tmp/igdl-browser-state.png' }); } catch (e) { /* diam */ }
      throw new EngineError('Browser engine tidak menghasilkan respons /api/convert (lihat /tmp/igdl-browser-state.png)', 'BROWSER_FAIL');
    }
    return { json: convertJson, via: 'chrome-headless' };
  } finally {
    try { await browser.close(); } catch (e) { /* diam */ }
  }
}

async function fetchEngineData(processedUrl) {
  let firstErr = null;
  try {
    return await callConvertAxios(processedUrl);
  } catch (e) {
    firstErr = e;
    if (['CAPTCHA', 'EMPTY', 'SERVER', 'NETWORK'].includes(e.code)) {
      try {
        log('[engine] axios gagal (' + e.code + ') -> fallback browser engine (bypass)');
        return await engineViaBrowser(processedUrl);
      } catch (e2) {
        if (e2 instanceof EngineError && e2.code === 'INVALID_REQUEST') throw e2;
        /* keduanya gagal: laporkan error axios dahulu */
        const err = new EngineError(e.message + ' | fallback browser juga gagal: ' + e2.message, firstErr.code, null);
        throw err;
      }
    }
    throw e;
  }
}

/* ------------------------------ Unduh file disk ------------------------------ */
async function download(url, outPath) {
  for (let a = 1; a <= MAX_RETRIES; a++) {
    const tmp = outPath + '.part';
    try {
      const res = await axios.get(url, {
        headers: HEADERS,
        responseType: 'stream',
        timeout: DL_TIMEOUT,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true,
      });
      if (res.status >= 400) {
        const err = new Error('HTTP ' + res.status + ' saat unduh');
        err.fatal = res.status < 500;
        throw err;
      }
      await new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(tmp);
        res.data.on('error', (er) => { try { ws.close(() => reject(er)); } catch (e) { reject(er); } });
        res.data.pipe(ws);
        ws.on('error', (er) => reject(er));
        ws.on('finish', () => resolve());
      });
      const bytes = fs.statSync(tmp).size;
      if (bytes < 500) throw new Error('File terlalu kecil (' + bytes + 'B)');
      fs.renameSync(tmp, outPath);
      return { ok: true, bytes };
    } catch (e) {
      try { fs.rmSync(tmp, { force: true }); } catch (e2) { /* diam */ }
      if (a === MAX_RETRIES || (e && e.fatal)) return { ok: false, error: (e && e.message) || String(e) };
      await sleep(900 * a);
    }
  }
}

/* ------------------------- Media: format & nama file ------------------------- */
function mediaFormatOf(item) {
  const e = String((item && (item.ext || item.type)) || '').toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'jpg';
  if (e === 'png') return 'png';
  if (e === 'webp') return 'webp';
  return 'mp4';
}
function isThumbLike(item) {
  const e = String((item && (item.ext || item.type)) || '').toLowerCase();
  return e === 'jpg' || e === 'jpeg' || e === 'png' || e === 'webp';
}
function fileNameFor(item, idx, shortcode) {
  const ext = mediaFormatOf(item);
  const sub = (item.subname || (item.quality != null ? item.quality + 'p' : '') || '').replace(/[^A-Za-z0-9]/g, '');
  return shortcode.replace(/[^A-Za-z0-9_-]/g, '') + '_' + String(idx + 1) + (sub ? '_' + sub : '') + '.' + ext;
}

/* ================================= MAIN ==================================== */
let quiet = false;
function log(m) { if (!quiet) process.stderr.write(m + '\n'); }

async function main() {
  cleanupJunk();
  const argv = process.argv.slice(2);
  quiet = argv.includes('--json');
  const nodata = argv.includes('--nodata');
  const raw = (argv.find((a) => a !== '--nodata' && a !== '--json')) || null;

  const result = {
    status: null,
    source: { input_url: raw, validation: null, shortcode: null, media_type: null },
    creator: null,
    stats: { like: null, comment: null, share: null },
    description: null,
    taken_at: null,
    media: { thumbnail: null, is_carousel: false, carousel_count: 0, items: [], available_quality: [] },
    engine: {
      name: 'fastdl.app',
      endpoint: API_CONVERT,
      method: 'POST',
      response_format: 'application/json',
      via: null,
    },
    storage: { directory: null, files: [], failed: [] },
    error: null,
  };

  /* 1) Validasi & identifikasi */
  let info;
  try {
    info = parseInstagramUrl(raw);
    result.source.validation = 'valid';
    result.source.normalized_url = info.processed;
    result.source.detected_media_type = info.mediaType;
    result.source.shortcode = info.shortcode;
    if (info.username) result.source.username_path = info.username;
  } catch (e) {
    result.status = 'error';
    result.source.validation = 'invalid';
    result.error = 'Penanganan link tidak valid: ' + e.message;
    emit(result, null);
    process.exit(1);
  }

  const shortcode = info.shortcode || info.username || 'media';
  const outDir = path.join(process.cwd(), OUT_BASE, shortcode);
  fs.mkdirSync(outDir, { recursive: true });
  result.storage.directory = outDir;

  /* 2) Proses engine (+ fallback browser bila captcha) */
  let engineRes;
  try {
    const { json, via } = await fetchEngineData(info.processed);
    engineRes = json;
    result.engine.via = via;
  } catch (e) {
    result.status = 'error';
    result.error = e.message;
    if (e.detail) result.engine.error_detail = e.detail;
    result.source.validation = 'valid';
    emit(result, null);
    process.exit(1);
  }

  /* 3) Peta data engine ke struktur output */
  const meta = engineRes.meta || {};
  const items = Array.isArray(engineRes.url) ? engineRes.url : [];
  result.status = 'success';
  result.source.shortcode = meta.shortcode || info.shortcode;
  result.source.media_type = info.mediaType;
  result.creator = meta.username || info.username || null;
  result.stats.like = meta.like_count != null ? meta.like_count : null;
  result.stats.comment = meta.comment_count != null ? meta.comment_count : null;
  result.stats.share = meta.share_count != null ? meta.share_count : null; /* engine tidak sediakan share_count */
  result.description = typeof meta.title === 'string' ? meta.title : null;
  result.taken_at = meta.taken_at ? new Date(meta.taken_at * 1000).toISOString() : null;
  result.media.thumbnail = typeof engineRes.thumb === 'string' ? engineRes.thumb : null;
  result.media.is_carousel = items.length > 1;
  result.media.carousel_count = items.length;
  result.media.items = items.map((it, i) => ({
    index: i,
    url: it.url,
    format: mediaFormatOf(it),
    is_video: !isThumbLike(it),
    quality: it.quality != null ? it.quality : null,
    quality_label: it.subname || null,
    filename: it.filename || null,
    suggested_filename: fileNameFor(it, i, shortcode),
  }));
  result.media.available_quality = [...new Set(items.map((it) => it.subname || (it.quality != null ? it.quality + 'p' : null)).filter(Boolean))];
  if (typeof engineRes.hd === 'string' && engineRes.hd) result.media.available_quality.push('HD (hd url)');
  if (typeof engineRes.sd === 'string' && engineRes.sd) result.media.available_quality.push('SD (sd url)');

  /* 4) Unduh semua media ke local file system storage */
  const plan = result.media.items.map((it) => ({ url: it.url, file: path.join(outDir, it.suggested_filename) }));
  if (result.media.thumbnail) plan.push({ url: result.media.thumbnail, file: path.join(outDir, shortcode + '_thumb.jpg') });
  log('[unduh] ' + plan.length + ' file target: ' + outDir);
  const t0 = Date.now();
  for (let i = 0; i < plan.length; i++) {
    if (nodata) {
      result.storage.files.push({ file: plan[i].file, bytes: 0, skipped: true });
      continue;
    }
    const r = await download(plan[i].url, plan[i].file);
    if (r.ok) {
      result.storage.files.push({ file: plan[i].file, bytes: r.bytes, size_mb: +(r.bytes / (1024 * 1024)).toFixed(2) });
      log('[unduh] ' + (i + 1) + '/' + plan.length + ' OK  ' + path.basename(plan[i].file) + ' (' + (r.bytes / (1024 * 1024)).toFixed(2) + ' MB)');
    } else {
      result.storage.failed.push({ file: plan[i].file, url: plan[i].url, error: r.error });
      log('[unduh] ' + (i + 1) + '/' + plan.length + ' GAGAL ' + path.basename(plan[i].file) + ' : ' + r.error);
    }
  }
  result.download_time_ms = Date.now() - t0;
  if (!nodata) {
    if (!result.storage.files.length && plan.length) result.status = 'error';
    if (result.storage.failed.length) {
      result.status = result.storage.files.length ? 'partial' : 'error';
      result.error = result.error || (result.storage.failed.length + ' unduhan gagal');
    }
  }
  try { fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(result, null, 1), 'utf8'); log('[unduh] result.json tersimpan: ' + path.join(outDir, 'result.json')); } catch (e) { /* diam */ }

  const summary = {
    Status: result.status,
    'Name Creator': result.creator,
    Like: result.stats.like,
    Comment: result.stats.comment,
    Share: result.stats.share,
    Deskripsi: result.description,
  };
  emit(result, summary);
}

/* --------------------------------- Emit ------------------------------------ */
function emit(result, summary) {
  if (!summary) {
    process.stdout.write(
      'Status:          error\n' +
      'Name Creator:    null\n' +
      'Like:            null\n' +
      'Comment:         null\n' +
      'Share:           null\n' +
      'Deskripsi:       ' + String((result && result.error) || '(tidak ada)') + '\n'
    );
    process.stdout.write('DETAIL_JSON:\n' + JSON.stringify(result, null, 1) + '\n');
    return;
  }
  if (!quiet) {
    process.stdout.write(
      'Status:          ' + safe(summary.Status) + '\n' +
      'Name Creator:    ' + safe(summary['Name Creator']) + '\n' +
      'Like:            ' + safe(summary.Like) + '\n' +
      'Comment:         ' + safe(summary.Comment) + '\n' +
      'Share:           ' + safe(summary.Share) + '\n' +
      'Deskripsi:       ' + String(summary.Deskripsi || '(tidak ada)') + '\n\n'
    );
    process.stdout.write('DETAIL_JSON:\n' + JSON.stringify(result, null, 1) + '\n');
  } else {
    process.stdout.write(JSON.stringify(result, null, 1) + '\n');
  }
}
function safe(v) { return v === null || v === undefined ? 'null' : v; }

/* ------------------------- escape hatch Screen ------------------------ */
/* Buang file uji di repo dir bila ada sisa */
function cleanupJunk() {
  for (const f of ['diff-test.js', 'diff-test2.js', 'full-capture.js', 'intercept-test.js', 'browser-check.js', 'capture-media.js']) {
    try { fs.rmSync(path.join(__dirname, f), { force: true }); } catch (e) { /* diam */ }
  }
}

main().catch((e) => {
  process.stdout.write(
    'Status:          error\n' +
    'Name Creator:    null\n' +
    'Like:            null\n' +
    'Comment:         null\n' +
    'Share:           null\n' +
    'Deskripsi:       ' + String((e && e.message) || e) + '\n'
  );
  process.stdout.write('DETAIL_JSON:\n' + JSON.stringify({ status: 'error', error: (e && e.message) || String(e) }, null, 1) + '\n');
  process.exit(1);
});