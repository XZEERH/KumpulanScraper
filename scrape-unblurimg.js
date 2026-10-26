#!/usr/bin/env node

/**
 * Name : Unblur AI
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web : https://unblurimage.ai
 * Type : Scraper
 * Method : POST
 * Description : Intinya unblurimage.ai adalah fitur AI untuk memperjelas gambar yang buram dengan meningkatkan ketajaman, detail, dan kejernihan gambar.
 * Note : Kuota anonim dari server, 3 gambar/hari per IP, kalau layanan utama habis, script otomatis pindah ke layanan cadangan (text-enhancer/blur-remover) yang punya pool kuota terpisah. Dan juga network-family otomatis fallback (4,6) sistem mencoba IPv4 dulu (eager via https_agent family), jika semua layanan kuota-habis di IPv4 baru coba IPv6, dikombinasikan dengan fallback service 3-tahap & rotasi serial yang ada, Btw Error fix sendiri.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');

/* ==================== KONFIG ==================== */
const SITE_URL = 'https://unblurimage.ai';
const API_BASE = 'https://api.unwatermark.ai/api';

const EP = {
  // Layanan utama = persis endpoint untuk tool unblurimage.ai (image-deblur).
  // Cadangan = layanan unblur satu keluarga pada gateway sama, pool kuota anonim
  // terpisah (/v1/text-enhancer & /v1/blur-remover) supaya scraping tidak
  // berhenti saat kuota layanan utama habis.
  services: [
    {
      nama: 'image-deblur',
      createJob: '/web/unblurimage/v1/image-deblur/create-job',
      getJob: '/web/unblurimage/v1/image-deblur/get-job',
      usageStatus: '/web/unblurimage/v1/image-deblur/usage-status',
    },
    {
      nama: 'text-enhancer',
      createJob: '/web/unblurimage/v1/text-enhancer/create-job',
      getJob: '/web/unblurimage/v1/text-enhancer/get-job',
      usageStatus: '/web/unblurimage/v1/text-enhancer/usage-status',
    },
    {
      nama: 'blur-remover',
      createJob: '/web/unblurimage/v1/blur-remover/create-job',
      getJob: '/web/unblurimage/v1/blur-remover/get-job',
      usageStatus: '/web/unblurimage/v1/blur-remover/usage-status',
    },
  ],
  // alias pertama (untuk kompatibilitas tampilan)
  createJob: '/web/unblurimage/v1/image-deblur/create-job',
  getJob: '/web/unblurimage/v1/image-deblur/get-job',
  usageStatus: '/web/unblurimage/v1/image-deblur/usage-status',
};

const PRODUCT_CODE = '067003'; // pid:"067003" pada bundle JS situs
const UA =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

const RULES_FALLBACK = {
  supported_formats: ['JPG', 'PNG', 'HEIC'],
  upload_size_limit: null, // situs: "We do not limit the size of the images you upload"
  max_processed_resolution_px: 4000, // FAQ: "maximum resolution ... 4000x4000 pixels"
};

const CFG = {
  timeouts: { create: 120000, poll: 30000, download: 180000, site: 30000 },
  poll: {
    intervalMs: 5000,
    firstDelayMs: 3000,
    maxDurationMs: 15 * 60 * 1000, // batas proses text-enhancer di frontend: 15 menit
    maxPollFail: 5,
    retriesCreate: 3,
  },
  upscale: 4,
  defaultResolution: '2K',
  validResolutions: ['2K', '4K', '8K'],
  // Kuota anonim dilacak server per alamat IP-PUBLIK dan IPv4/IPv6 = pool TERPISAH.
  // Di jaringan ponsel, semua alamat IPv6 SLAAC device berada di SATU /64 (kunci kuota
  // sama), sedangkan egress IPv4 CGNAT adalah pool lain yang menua sendiri.
  // Karena itu urutan fallback: coba IPv4 dulu (paling tahan lama), lalu IPv6.
  netFamilies: [4, 6],
};

const KODE_OK = [100000, 200, 300000, 300007];
const KODE_GAGAL = {
  300001: 'TASK_CREATE_FAILURE',
  300008: 'TASK_FAILURE',
  300003: 'CONTENT_VIOLATION',
  300023: 'CONTENT_VIOLATION_COMMUNITY',
  400000: 'FAILURE',
  400301: 'PARAM_ERROR',
  400201: 'TASK_TIMEOUT',
  500000: 'SYSTEM_ERROR',
};
const KODE_KUOTA = {
  300017: 'FREE_TIMES_NOT_ENOUGH',
  300021: 'FREE_TIMES_EXHAUSTED',
  300018: 'CREDITS_NOT_ENOUGH',
  300002: 'CREDITS_EXHAUSTED',
};

/* ==================== UTIL ==================== */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (msg) => process.stderr.write(`[unblurimg] ${msg}\n`);
const errMsg = (e) => (e && (e.message || e.reason)) || String(e);

function msgOf(code, msgObj) {
  if (!msgObj) return '';
  if (typeof msgObj === 'string') return msgObj;
  if (typeof msgObj === 'object') return msgObj.en || msgObj.id || Object.values(msgObj)[0] || '';
  return String(msgObj);
}

/* Deteksi format & dimensi dari byte (tanpa dependency tambahan) */
function detectFormat(buf, filePath = '') {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  if (buf.length >= 12 && buf.slice(4, 8).toString() === 'ftyp') return 'heic';
  if (/\.png$/i.test(filePath)) return 'png';
  if (/\.webp$/i.test(filePath)) return 'webp';
  if (/\.jpe?g$/i.test(filePath)) return 'jpg';
  return 'jpg';
}

function pngDims(buf) {
  if (buf.length < 33) return null;
  try {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch (_) {
    return null;
  }
}

function jpegDims(buf) {
  try {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      const len = buf.readUInt16BE(i + 2);
      if (len <= 1) break;
      i += 2 + len;
    }
  } catch (_) {}
  return null;
}

function webpDims(buf) {
  try {
    const fmt = buf.slice(12, 16).toString();
    if (fmt === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (fmt === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (fmt === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
  } catch (_) {}
  return null;
}

function dimsOf(buf, fmt) {
  const d = fmt === 'png' ? pngDims(buf) : fmt === 'jpg' ? jpegDims(buf) : webpDims(buf);
  return d && d.width > 0 && d.height > 0 ? d : null;
}

/* ==================== BYPASS: FINGERPRINT ==================== */
/**
 * Meniru fungsi UV() situs (fingerprint web-client-device):
 *   raw = [ua, bahasa, screen, tzOffset, platform].join("|")
 *   hash: o = (o << 5) - o + charCode; hasil bertanda -> abs -> base36
 * Serial acak-deterministik per run => server memandang run ini sebagai "device anonim baru".
 */
function buildProductSerial() {
  const raw = [UA, 'id-ID', '1080x2400', new Date().getTimezoneOffset(), 'Android', Math.random().toFixed(12)].join('|');
  let o = 0;
  for (let i = 0; i < raw.length; i++) {
    o = ((o << 5) - o + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(o).toString(36);
}

function apiHeaders(serial) {
  // Meniru interceptor $http situs (ofetch -> onRequest):
  //   Product-Serial = fingerprint, Product-Code = pid situs,
  //   Authorization tidak diperlukan (anonim), Origin/Referer dari domain resmi.
  return {
    'User-Agent': UA,
    Accept: 'application/json',
    'Product-Code': PRODUCT_CODE,
    'Product-Serial': serial,
    Origin: SITE_URL,
    Referer: SITE_URL + '/',
  };
}

/* ==================== REQUEST DASAR (timeout + retry + JARINGAN family-bind) ==================== */
/** Agent HTTPS yang memaksa family jaringan tertentu (4=IPv4 / 6=IPv6) */
function agentFor(fam) {
  if (Math.abs(Number(fam)) !== 4 && Math.abs(Number(fam)) !== 6) return undefined;
  return new https.Agent({ family: Number(fam), keepAlive: false });
}

async function apiReq(cfg) {
  const max = cfg.retries ?? 3;
  const agent = agentFor(cfg.family);
  let lastErr = null;
  for (let attempt = 0; attempt < max; attempt++) {
    try {
      const res = await axios.request({
        method: cfg.method,
        url: cfg.url.startsWith('http') ? cfg.url : API_BASE + cfg.url,
        data: cfg.data,
        headers: cfg.headers,
        timeout: cfg.timeoutSec || 60000,
        httpsAgent: agent,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: (s) => s < 400,
      });
      return res.data;
    } catch (e) {
      lastErr = e;
      const st = e.status;
      const hardFail = st >= 500 || ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'].includes(e.code);
      if (attempt >= max - 1 || (!hardFail && st)) break;
      log(`Kendala jaringan/server (${st || e.code || e.message}) - retry ${attempt + 1}/${max - 1}...`);
      await sleep(1500 * (attempt + 1));
    }
  }
  throw lastErr;
}

/* ==================== 1. SCRAPE INFO SITUS (cheerio) ==================== */
async function scrapeSiteInfo() {
  const info = {
    engine: 'Nuxt 3 (Vue 3 + Nuxt UI, SSR statis + Cloudflare)',
    scraper_method: 'HTTP API langsung (axios) - halaman perlu JS, tapi semua data lewat JSON API',
    title: null,
    description: null,
    ...RULES_FALLBACK,
  };
  try {
    const { data: html } = await axios.get(SITE_URL, {
      timeout: CFG.timeouts.site,
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      validateStatus: (s) => s < 500,
    });
    if (typeof html !== 'string' || !html.includes('<')) throw new Error('HTML tidak valid');

    const $ = cheerio.load(html);
    info.title = ($('title').first().text() || '').trim() || null;
    info.description =
      ($('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        '')
        .trim() || null;

    // Aturan dari FAQ JSON-LD: format didukung, batas ukuran, batas resolusi
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const j = JSON.parse($(el).text());
        const items = Array.isArray(j) ? j : [j];
        for (const it of items) {
          const qas = it['@type'] === 'FAQPage' ? it.mainEntity || [] : [];
          for (const q of qas) {
            const ans = (q.acceptedAnswer && q.acceptedAnswer.text) || '';
            const mRes = ans.match(/maximum resolution.*?(\d{3,5})\s?\u00d7\s?(\d{3,5})/i);
            if (mRes) info.max_processed_resolution_px = Number(mRes[1]);
            const mFmt = ans.match(/formats like ([A-Za-z, ]+)/);
            if (mFmt) {
              info.supported_formats = mFmt[1]
                .split(/,|\band\b/i)
                .map((s) => s.trim())
                .filter(Boolean);
            }
            const mSize = ans.match(/(?:file size|size limit).*?(\d+)\s?MB/i);
            if (mSize) info.upload_size_limit = mSize[1] + 'MB';
          }
        }
      } catch (_) {}
    });
  } catch (e) {
    info.note = 'gagal diambil (' + errMsg(e) + ') => memakai nilai fallback FAQ';
  }
  return info;
}

/* ==================== 2. VALIDASI & PERSIAPAN FILE LOKAL ==================== */
function prepareInput(inputPath) {
  const abs = path.resolve(inputPath);
  if (!fs.existsSync(abs)) throw Object.assign(new Error(`File tidak ditemukan: ${abs}`), { code: 'FILE_NOT_FOUND' });
  if (!fs.statSync(abs).isFile()) throw Object.assign(new Error(`Bukan file biasa: ${abs}`), { code: 'NOT_FILE' });

  const buf = fs.readFileSync(abs);
  if (!buf.length) throw Object.assign(new Error(`File kosong (0 byte): ${abs}`), { code: 'EMPTY_FILE' });

  const fmt = detectFormat(buf, abs);
  const dims = dimsOf(buf, fmt);
  const mkDims = dims ? `${dims.width}x${dims.height}` : null;
  // Aturan situs: format PNG/JPG/HEIC; resolusi maksimum hasil 4000x4000
  if (dims && Math.max(dims.width, dims.height) > 4000 * 3) {
    log(`Peringatan: input ${mkDims} > resolusi proses maksimum umum situs (4000x4000x${3 * 4}x upscale) - server tetap dipandu.`);
  }
  return {
    absPath: abs,
    dirName: path.dirname(abs),
    baseName: path.basename(abs, path.extname(abs)),
    buf,
    size: buf.length,
    fmt,
    dims,
    dimsStr: mkDims,
    formatSupported: ['png', 'jpg', 'heic', 'webp'].includes(fmt),
  };
}

/* ==================== 3. FLOW: CREATE -> POLL -> DOWNLOAD ==================== */
async function runUnblur(inputPath, opts) {
  const t0 = Date.now();
  const file = prepareInput(inputPath);
  const serial = buildProductSerial();
  const headers = apiHeaders(serial);
  log(`Input: ${file.absPath} (${(file.size / 1024).toFixed(1)} KB, format=${file.fmt}${file.dimsStr ? ', ' + file.dimsStr : ''})`);

  const meta = {
    timestamp: new Date().toISOString(),
    target_site: SITE_URL,
    engine_frontend: 'Nuxt 3 (Vue 3 + Nuxt UI)',
    scraper_engine: 'axios (Node.js) + cheerio (analisis halaman)',
    api_base: API_BASE,
    service_chain: EP.services.map((s) => s.nama),
    method_create_job: 'POST multipart/form-data (FormData multipart)',
    endpoints: EP.services,
    request_headers: apiHeaders(serial),
    auth: 'Tanpa login/token/CSRF. Otentikasi anonim via Product-Code + Product-Serial (fingerprint ditiru situs).',
    payload_create_job: {
      original_image_file: `image.${file.fmt}`,
      upscale: CFG.upscale,
      output_resolution: opts.resolution,
      file_format: 'jpg',
    },
    input: { path: file.absPath, size_bytes: file.size, format_detected: file.fmt, resolution: file.dimsStr },
    quality_requested: opts.resolution,
    network_family_chain: opts.famChain || null,
  };

  /* ---- kuota anonim semua layanan (info) ---- */
  meta.free_quota_before = {};
  for (const svc of EP.services) {
    try {
      const q = await apiReq({ method: 'GET', url: svc.usageStatus, headers, timeoutSec: CFG.timeouts.poll, retries: 2 });
      if (q && q.result) {
        meta.free_quota_before[svc.nama] = q.result.remaining_free_times;
      }
    } catch (_) {
      meta.free_quota_before[svc.nama] = 'n/a';
    }
  }
  log(`Kuota gratis per layanan: ${JSON.stringify(meta.free_quota_before)}`);

  /* ---- create job + poll (fallback berlapis: family jaringan x layanan x rotasi serial) ---- */
  log('POST create-job (upload gambar + parameter AI)...');

  const makeForm = () => {
    const f = new FormData();
    f.append('original_image_file', new Blob([file.buf]), `image.${file.fmt}`);
    f.append('upscale', String(CFG.upscale));
    f.append('output_resolution', opts.resolution);
    f.append('file_format', 'jpg');
    return f;
  };

  let jobId = null;
  let chosenSvc = null;
  let chosenFam = null;
  let createTrace = [];
  let lastQuotaError = null;

  for (const fam of opts.famChain || [4]) {
    if (chosenSvc) break;
    log(`Mode jaringan: IPv${fam}`);
    for (const svc of EP.services) {
      // tiap layanan: coba dgn serial awal; jika kuota habis, rotasi serial (device anon baru)
      for (let attempt = 0; attempt < 2; attempt++) {
        const h = attempt === 0 ? apiHeaders(serial) : apiHeaders(buildProductSerial());
        let jobRes;
        try {
          jobRes = await apiReq({
            method: 'POST',
            url: svc.createJob,
            headers: h,
            data: makeForm(),
            timeoutSec: CFG.timeouts.create,
            retries: CFG.poll.retriesCreate,
            family: fam,
          });
        } catch (e) {
          createTrace.push({ family: 'IPv' + fam, service: svc.nama, error: errMsg(e) });
          break; // error jaringan keras: lanjut layanan berikutnya
        }
        createTrace.push({ family: 'IPv' + fam, service: svc.nama, code: jobRes.code, message: msgOf(jobRes.code, jobRes.message) });
        meta['response_create_job_' + svc.nama] = { code: jobRes.code, message: msgOf(jobRes.code, jobRes.message), result: jobRes.result || null };

        if (KODE_OK.includes(jobRes.code)) {
          jobId = (jobRes.result || {}).job_id || null;
          if (jobId) {
            chosenSvc = svc;
            chosenFam = fam;
            break;
          }
        } else if (KODE_KUOTA[jobRes.code]) {
          lastQuotaError = { code: jobRes.code, tech: KODE_KUOTA[jobRes.code], service: svc.nama, family: 'IPv' + fam };
          await sleep(1200); // rotasi fingerprint
          continue;
        } else if (jobRes.code === 300006) {
          break;
        } else {
          break;
        }
      }
      if (chosenSvc) break;
      log(`Layanan ${svc.nama} gagal di IPv${fam}; lanjut...`);
    }
  }

  meta.create_trace = createTrace;
  if (!chosenSvc) {
    const reason = lastQuotaError
      ? `Semua layanan anonim kuota habis di semua mode jaringan (${(opts.famChain || []).map((f) => 'IPv' + f).join(', ')}); terakhir: ${lastQuotaError.family}/${lastQuotaError.service}, code ${lastQuotaError.code}, ${lastQuotaError.tech}. Kuota anonim per-IP-family reset ±17 jam (field refresh_seconds), atau coba via koneksi jaringan lain.`
      : 'Membuat job gagal di semua layanan: ' + JSON.stringify(createTrace);
    throw Object.assign(new Error(reason), { code: lastQuotaError ? 'QUOTA_EXHAUSTED' : 'CREATE_FAILED' });
  }

  const svc = chosenSvc;
  const fam = chosenFam;
  meta.family_used = fam;
  meta.service_used = svc.nama;
  meta.job_id = jobId;
  log(`Service dipakai: ${svc.nama} (IPv${fam}) | Job ID: ${jobId}`);

  let outUrls = [];

  /* ---- poll get-job sampai output tersedia ---- */
  if (!outUrls.length) {
    const pollStart = Date.now();
    await sleep(CFG.poll.firstDelayMs);
    let pollFails = 0;
    while (Date.now() - pollStart < CFG.poll.maxDurationMs) {
      try {
        const st = await apiReq({
          method: 'GET',
          url: svc.getJob + '/' + jobId,
          headers,
          timeoutSec: CFG.timeouts.poll,
          retries: 1,
          family: fam,
        });
        const r = st.result || {};
        const ou = Array.isArray(r.output_url)
          ? r.output_url
          : r.output_url
          ? [r.output_url]
          : Array.isArray(r.output_image_url)
          ? r.output_image_url
          : r.output_image_url
          ? [r.output_image_url]
          : null;
        if (ou) outUrls = ou;

        meta.last_poll_response = {
          code: st.code,
          message: msgOf(st.code, st.message),
          server_status: r.status,
          elapsed_s: +((Date.now() - pollStart) / 1000).toFixed(1),
        };

        if (outUrls.length && KODE_OK.includes(st.code)) {
          log(`Status sukses (code ${st.code}): ${msgOf(st.code, st.message)}`);
          break;
        }
        if (KODE_GAGAL[st.code]) {
          throw Object.assign(
            new Error(`Processing gagal di server (code ${st.code} ${KODE_GAGAL[st.code]}): ${msgOf(st.code, st.message)}`),
            { code: 'PROCESS_FAILED' }
          );
        }
        log(`Proses AI berjalan... (${((Date.now() - pollStart) / 1000) | 0}s, status=${r.status})`);
      } catch (e) {
        if (e && e.code === 'PROCESS_FAILED') throw e;
        pollFails++;
        if (pollFails >= CFG.poll.maxPollFail) {
          throw Object.assign(new Error('Polling status gagal berulang: ' + errMsg(e)), { code: 'POLL_FAILED' });
        }
        log(`Polling error (${errMsg(e)}); retry ${pollFails}/${CFG.poll.maxPollFail}...`);
      }
      await sleep(CFG.poll.intervalMs);
    }
  }

  if (!outUrls.length) {
    throw Object.assign(
      new Error(`Processing tidak selesai dalam ${CFG.poll.maxDurationMs / 60000} menit / hasil kosong dari server.`),
      { code: 'TIMEOUT_OR_EMPTY' }
    );
  }

  meta.result_urls = outUrls;
  const outUrl = outUrls[0];

  /* ---- automatic image download & local file system storage ---- */
  log('Mengunduh hasil...');
  const dl = await axios.get(outUrl, {
    headers: { 'User-Agent': UA, Accept: 'image/*,*/*', Referer: SITE_URL + '/' },
    responseType: 'arraybuffer',
    timeout: CFG.timeouts.download,
    validateStatus: (s) => s < 400,
    maxContentLength: Infinity,
    httpsAgent: agentFor(fam),
  });
  const outBuf = Buffer.from(dl.data);
  if (!outBuf.length) throw Object.assign(new Error('Unduhan hasil kosong.'), { code: 'EMPTY_DOWNLOAD' });

  const ct = String(dl.headers['content-type'] || '');
  let subtype = (ct.split('/')[1] || '').split(';')[0].trim().toLowerCase(); // jpeg|png|webp|...
  let outFormat = subtype === 'jpeg' ? 'jpg' : subtype || 'jpg';
  if (!['jpg', 'png', 'webp'].includes(outFormat)) outFormat = 'jpg';

  const saveDir = opts.outDir || file.dirName;
  fs.mkdirSync(saveDir, { recursive: true });
  const savePath = path.join(saveDir, `${file.baseName}-unblurred.${outFormat}`);
  fs.writeFileSync(savePath, outBuf);

  const outDims = dimsOf(outBuf, outFormat);
  log(`Tersimpan: ${savePath} (${(outBuf.length / 1024).toFixed(1)} KB)`);

  return {
    jobId,
    outUrl,
    meta,
    elapsed: +((Date.now() - t0) / 1000).toFixed(2),
    input: file,
    outDims,
    outSize: outBuf.length,
    outFormat,
    savePath,
  };
}

/* ==================== MAIN & OUTPUT JSON ==================== */
async function main() {
  const mainStart = Date.now();
  const args = process.argv.slice(2);

  let inputPath = null;
  let resolution = CFG.defaultResolution;
  let outDir = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (CFG.validResolutions.includes(a.toUpperCase())) resolution = a.toUpperCase();
    else if (a === '--out') outDir = args[++i] || null;
    else if (a === '-h' || a === '--help') {
      console.log('Usage: node scrape-unblurimg.js <path-gambar> [2K|4K|8K] [--out <folderSimpan>]');
      process.exit(0);
    } else if (!inputPath) inputPath = a;
  }
  if (!inputPath) {
    console.log('Usage: node scrape-unblurimg.js <path-gambar> [2K|4K|8K] [--out <folderSimpan>]');
    process.exit(1);
  }

  log('== Analisis halaman target (cheerio) ==');
  const site = await scrapeSiteInfo();
  if (site.title) log(`Judul situs: ${site.title}`);

  log('== Alur AI unblur ==');
  let R = null;
  let err = null;
  try {
    R = await runUnblur(inputPath, { resolution, outDir, famChain: CFG.netFamilies });
  } catch (e) {
    err = e;
    // Ulangi sekali hanya untuk kegagalan JARINGAN/process (kuota tidak akan berubah dgn retry)
    const cls = String((e && e.code) || '');
    if (['CREATE_FAILED', 'POLL_FAILED', 'TIMEOUT_OR_EMPTY'].includes(cls)) {
      log(`Kegagalan (${cls}) => coba ulang satu kali...`);
      await sleep(2000);
      try {
        R = await runUnblur(inputPath, { resolution, outDir, famChain: CFG.netFamilies });
        err = null;
      } catch (e2) {
        err = e2;
      }
    }
  }

  const siteRules = {
    supported_formats_scraped: site.supported_formats,
    upload_size_limit_scraped: site.upload_size_limit,
    max_processed_resolution_px_scraped: site.max_processed_resolution_px,
    source: 'FAQ JSON-LD ' + SITE_URL,
  };

  /* Struktur output persis permintaan: Status, Processing Time, AI Model, Quality, Hasil */
  const output = {
    Status: null,
    'Processing Time': null,
    'AI Model': null,
    Quality: null,
    Hasil: null,
    Metadata: null,
  };

  if (R) {
    output.Status = {
      state: 'SUCCESS',
      message: 'Unblur selesai; hasil terunduh otomatis ke penyimpanan lokal',
      job_id: R.jobId,
      task_status_endpoint_digunakan: (EP.services.find((s) => s.nama === R.meta.service_used)?.getJob) + '/' + R.jobId,
      final_server_code: 100000,
    };
    output['Processing Time'] = `${R.elapsed} detik`;
    output['AI Model'] = {
      nama_produk: 'UnblurImage AI (DeBlur/image-deblur engine)',
      service: `web/unblurimage/v1/${R.meta.service_used}`,
      service_used: R.meta.service_used,
      create_job_endpoint: EP.services.find((s) => s.nama === R.meta.service_used)?.createJob,
      poll_endpoint: (EP.services.find((s) => s.nama === R.meta.service_used)?.getJob) + '/{job_id}',
      api_gateway: API_BASE,
      processing_parameter: {
        upscale: CFG.upscale,
        output_resolution: resolution,
        file_format: 'jpg',
      },
      mode_frontend_situs: 'text-enhancer',
    };
    output.Quality = {
      tingkat: resolution === '4K' ? 'Ultra High (4K)' : resolution === '8K' ? 'Best (8K)' : 'High (2K)',
      upscale_faktor: CFG.upscale,
      resolusi_input: R.input.dimsStr,
      resolusi_output: R.outDims ? `${R.outDims.width}x${R.outDims.height}` : null,
      perkiraan_upscale_aktual:
        R.input.dims && R.outDims ? Math.round((R.outDims.width / R.input.dims.width) * 100) / 100 + 'x' : 'n/a',
      format_input: R.input.fmt.toUpperCase(),
      format_output: R.outFormat.toUpperCase(),
      ukuran_output_bytes: R.outSize,
      aturan_situs: siteRules,
    };
    output.Hasil = {
      success: true,
      job_id: R.jobId,
      task_id: R.jobId,
      input_image_url_server: (R.meta['response_create_job_' + R.meta.service_used]?.result || {}).input_url || null,
      output_image_url: R.outUrl,
      semua_url_hasil: R.meta.result_urls,
      file_lokal: {
        saved_to: R.savePath,
        storage_type: 'Local File System Storage (automatic image download)',
        ukuran_bytes: R.outSize,
      },
    };
    output.Metadata = R.meta;
    // pastikan kode server final dicatat secara jujur (create instan vs hasil polling)
    if (!R.meta.last_poll_response) {
      output.Status.final_server_code = (R.meta['response_create_job_' + R.meta.service_used] || {}).code ?? 100000;
      output.Status.message = 'Unblur selesai (hasil langsung tersedia saat create-job); hasil terunduh otomatis ke penyimpanan lokal';
    }
  } else {
    const isQuota = err && String((err.code || '') + ' ' + (err.tech || '')).includes('QUOTA');
    output.Status = {
      state: 'FAILED',
      message: errMsg(err) || 'kesalahan tidak diketahui',
      error_category: (err && err.code) || 'UNKNOWN',
      retry_used: isQuota ? 'rotasi fingerprint + fallback IPv4/IPv6 sudah dijalankan' : 'belum',
    };
    output['Processing Time'] = `${+((Date.now() - mainStart) / 1000).toFixed(2)} detik (sebelum gagal)`;
    output['AI Model'] = {
      nama_produk: 'UnblurImage AI (DeBlur/image-deblur engine)',
      service: 'web/unblurimage/v1/image-deblur',
      create_job_endpoint: EP.services[0].createJob,
      fallback_services: EP.services.map((s) => s.nama),
      api_gateway: API_BASE,
    };
    output.Quality = { tingkat: resolution, format_output: 'JPG' };
    output.Hasil = {
      success: false,
      got_error: errMsg(err),
      job_id: (R && R.jobId) || null,
      file_lokal: null,
    };
    output.Metadata = {
      target_site: SITE_URL,
      api_base: API_BASE,
      endpoints: EP.services,
      site_info: site,
    };
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((e) => {
  console.error('[unblurimg] FATAL:', errMsg(e));
  process.exit(1);
});