#!/usr/bin/env node

/**
 * Name : MediaFire Downloader
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://www.mediafire.com
 * Type : Scraper
 * Description : mengunduh berbagai jenis file melalui tautan
 * Note : error fix sendiri
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const PAGE_TIMEOUT_MS = 30000;
const DL_TIMEOUT_MS = 120000;
const DEFAULT_OUT_DIR = path.resolve(process.cwd(), 'downloads');

/* ============================ HTTP CLIENT ============================ */

const http = axios.create({
  timeout: PAGE_TIMEOUT_MS,
  maxRedirects: 5,
  validateStatus: () => true, // status ditangani manual agar pesan error jelas
  headers: {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.mediafire.com/',
  },
});

/* ============================== HELPERS ============================= */

function cleanText(str) {
  return (str || '').replace(/\s+/g, ' ').trim();
}

function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '0B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 2).replace(/\.00$/, '')}${units[i]}`;
}

function extractFileId(sourceUrl, html) {
  // 1) Dari URL: /file/{key}/... atau /download/{key}/...
  const fromUrl = sourceUrl.match(/mediafire\.com\/(?:file|download)\/([a-z0-9]+)/i);
  if (fromUrl) return fromUrl[1];
  // 2) Fallback: parameter qkey di link download_repair / dkey di HTML
  const qkey = html.match(/[?&]qkey=([a-z0-9]+)/i);
  if (qkey) return qkey[1];
  const dkey = html.match(/[?&]dkey=([a-z0-9]+)/i);
  if (dkey) return dkey[1];
  return null;
}

function extractFileType(filetypeRaw, fileName) {
  if (filetypeRaw) return filetypeRaw; // mis. "Compressed Archive (.ZIP)"
  const ext = (fileName && fileName.includes('.'))
    ? fileName.split('.').pop().toUpperCase()
    : '';
  return ext ? `File (${ext})` : null;
}

/* =========================== PAGE SCRAPING =========================== */

function collectCookies(res) {
  const setCookies = [].concat(res.headers['set-cookie'] || []);
  return setCookies
    .map((c) => c.split(';')[0])
    .filter(Boolean)
    .join('; ');
}

async function fetchPageHtml(url, cookie) {
  let res;
  try {
    res = await http.get(url, cookie ? { headers: { Cookie: cookie } } : {});
  } catch (err) {
    throw new Error(
      `Request gagal: ${err.code || err.message}` +
        (err.code === 'ECONNABORTED' ? ` (timeout ${PAGE_TIMEOUT_MS}ms)` : '')
    );
  }

  if (res.status === 404) throw new Error('Halaman tidak ditemukan (HTTP 404)');
  if (res.status !== 200) throw new Error(`Server merespons HTTP ${res.status}`);
  if (!res.data) throw new Error('Data kosong: server mengembalikan halaman tanpa isi');

  return { html: String(res.data), cookies: collectCookies(res) };
}

function parseFilePage(html, sourceUrl) {
  const $ = cheerio.load(html);

  // --- Deteksi halaman error / file hilang ---
  const pageText = cleanText($('body').text());
  const invalidSigns = [
    'Invalid or Deleted File',
    'The Key You Provided Was Invalid',
    'Sorry, that file doesn’t exist',
    'file is no longer available',
  ];
  if (invalidSigns.some((sign) => pageText.toLowerCase().includes(sign.toLowerCase()))) {
    throw new Error('File tidak valid / sudah dihapus dari MediaFire');
  }

  // --- Deteksi varian halaman ad-gate (blok info tidak dirender) ---
  const variantPage = $('.dl-info .intro .filename').length === 0;

  // --- fileName ---
  let fileName = cleanText($('.dl-info .intro .filename').first().text());
  if (!fileName) fileName = cleanText($('meta[property="og:title"]').attr('content'));
  if (!fileName) fileName = cleanText($('title').first().text());

  // --- fileType ---
  const filetypeRaw = cleanText($('.dl-info .intro .filetype').first().text());
  const fileType = extractFileType(filetypeRaw, fileName);

  // --- fileSize: ul.details li ("File size: <span>20.79MB</span>"), fallback teks tombol ---
  let fileSize = null;
  $('.dl-info ul.details li').each((_, li) => {
    const liText = cleanText($(li).text());
    if (/file size/i.test(liText)) {
      fileSize = cleanText($(li).find('span').text()) || liText.replace(/file size:?/i, '').trim();
    }
  });
  if (!fileSize) {
    const btnText = cleanText($('a#downloadButton').first().text());
    const m = btnText.match(/\(([^)]+)\)/);
    if (m) fileSize = cleanText(m[1]);
  }

  // --- downloadUrl: a#downloadButton href; fallback regex link langsung ---
  let downloadUrl = $('a#downloadButton').first().attr('href') || '';
  const directPattern = /https:\/\/download\d*\.mediafire\.com\/[^\s"'<>]+/i;
  if (!downloadUrl || !/^https?:\/\//i.test(downloadUrl)) {
    const m = html.match(directPattern);
    if (m) downloadUrl = m[0].replace(/&amp;/g, '&');
  }
  if (downloadUrl && !directPattern.test(downloadUrl)) {
    // URL bukan tautan langsung (mis. halaman perantara) — coba cari link langsung
    const m = html.match(directPattern);
    if (m) downloadUrl = m[0].replace(/&amp;/g, '&');
  }

  // --- fileId ---
  const fileId = extractFileId(sourceUrl, html);

  // --- Lengkapi ekstensi fileName jika hilang (varian halaman) ---
  if (fileName && !/\./.test(fileName) && downloadUrl) {
    const basename = decodeURIComponent(downloadUrl.split('?')[0].split('/').pop() || '');
    const extMatch = basename.match(/\.([a-zA-Z0-9]{1,6})$/);
    if (extMatch) fileName += '.' + extMatch[1].toLowerCase();
  }

  // --- fileType fallback dari ekstensi fileName yang sudah diperbaiki ---
  const fileTypeFinal = fileType || extractFileType(null, fileName);

  // --- Data kosong ---
  if (!fileName && !downloadUrl) {
    throw new Error('Data kosong: tidak menemukan nama file maupun tautan unduhan (halaman mungkin memuat gate/iklan)');
  }

  return {
    fileName: fileName || null,
    fileSize: fileSize || null,
    fileType: fileTypeFinal || null,
    fileId: fileId || null,
    downloadUrl: downloadUrl || null,
    variantPage,
  };
}

/* ========================== STREAM DOWNLOAD ========================== */

/**
 * Mengambil aliran data (fileStream) dari tautan unduhan langsung,
 * menyimpannya ke disk, lalu memipenya. Mengembalikan stream + info bytes.
 */
async function downloadStream(downloadUrl, outDir, outName, referer) {
  let res;
  try {
    res = await http.get(downloadUrl, {
      responseType: 'stream',
      timeout: DL_TIMEOUT_MS,
      headers: { Referer: referer || 'https://www.mediafire.com/' },
    });
  } catch (err) {
    throw new Error(
      `Unduhan gagal: ${err.code || err.message}` +
        (err.code === 'ECONNABORTED' ? ` (timeout ${DL_TIMEOUT_MS}ms)` : '')
    );
  }

  if (res.status !== 200) {
    if (res.data && typeof res.data.destroy === 'function') res.data.destroy();
    throw new Error(`Unduhan gagal: server merespons HTTP ${res.status}`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const safeName = outName.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'mediafire_download';
  const savedPath = path.join(outDir, safeName);

  const fileStream = res.data; // stream Node.js murni — bisa di-pipe ke mana saja
  let bytes = 0;
  fileStream.on('data', (chunk) => {
    bytes += chunk.length;
  });

  const saved = await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(savedPath);
    out.on('finish', () => resolve(savedPath));
    out.on('error', reject);
    fileStream.on('error', reject);
    fileStream.pipe(out);
  });

  return { stream: fileStream, savedPath: saved, bytes };
}

/* ============================ PIPELINE ============================== */

async function scrapeMediafire(url, options = {}) {
  const { outDir = DEFAULT_OUT_DIR, download = true } = options;

  // Hasilkan halaman; jika MediaFire menyetir varian ad-gate, coba lagi
  // sesi (cookies header) hingga 3x. Halaman error (file invalid) langsung dilempar.
  let info = null;
  let cookie = null;
  const MAX_ATTEMPTS = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const page = await fetchPageHtml(url, cookie);
    cookie = page.cookies || cookie;
    info = parseFilePage(page.html, url);
    if (!info.variantPage) break;
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 800));
      continue;
    }
    lastError = new Error('Halaman MediaFire menampilkan varian ad-gate berulang kali (gate/iklan)');
  }

  // Varian berulang tanpa tautan unduhan = gagal; dengan tautan = lanjut (data diperbaiki)
  if (info.variantPage && !info.downloadUrl) throw lastError;

  const result = {
    fileName: info.fileName,
    fileSize: info.fileSize,
    fileType: info.fileType,
    fileId: info.fileId,
    downloadUrl: info.downloadUrl,
    fileStream: null,
  };

  if (download && info.downloadUrl) {
    const dl = await downloadStream(info.downloadUrl, outDir, info.fileName, url);
    result.fileStream = {
      type: 'stream',
      status: 'downloaded',
      savedPath: dl.savedPath.replace(/\\/g, '/'),
      bytes: dl.bytes,
      bytesFormatted: formatBytes(dl.bytes),
      echo: 'Stream data file siap dikirim (objek Node.js Stream, salin pola pipe() pada fungsi downloadStream)',
    };
  } else {
    result.fileStream = {
      type: 'stream',
      status: 'not_downloaded',
      note: download
        ? 'Tautan unduhan tidak tersedia'
        : 'Lewati unduhan (--no-download); stream dapat diambil dari downloadUrl',
    };
  }

  return result;
}

/* ============================== OUTPUT ============================== */

function printHuman(result, index) {
  const prefix = index ? `[${index}] ` : '';
  console.log('');
  console.log(
    `${prefix}fileName/Nama file: ${result.fileName} ` +
      `fileSize/ukuran file: ${result.fileSize} ` +
      `fileType/format file: ${result.fileType}`
  );
  console.log(
    `fileId/id file: ${result.fileId} ` +
      `downloadUrl/tautan unduhan: ${result.downloadUrl}`
  );
  const fsInfo =
    result.fileStream.status === 'downloaded'
      ? `${result.fileStream.savedPath} (${result.fileStream.bytesFormatted}, ${result.fileStream.bytes} byte)`
      : `${result.fileStream.status} — ${result.fileStream.note || ''}`;
  console.log(`fileStream/aliran data file/zip yg akan dikirim: ${fsInfo}`);
}

/* ================================ CLI =============================== */

function parseArgs(argv) {
  const args = { urls: [], out: DEFAULT_OUT_DIR, noDownload: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') {
      args.out = path.resolve(process.cwd(), argv[++i] || '');
      if (!args.out) throw new Error('--out membutuhkan argumen direktori');
    } else if (a === '--no-download') {
      args.noDownload = true;
    } else if (a === '--help' || a === '-h') {
      args.urls = null;
    } else if (/^mediafire\.com|^https?:\/\/(.*mediafire\.com)/i.test(a) || a.endsWith('/file')) {
      args.urls.push(a);
    } else if (a.includes('mediafire.com')) {
      args.urls.push(a);
    } else {
      throw new Error(`Argumen tidak dikenal: ${a}`);
    }
  }
  return args;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv);
  } catch (e) {
    console.error('Error argumen: ' + e.message);
    console.error('Pemakaian: node scrape-mediafiredl.js <url> [--out <dir>] [--no-download]');
    process.exit(2);
  }

  if (args.urls === null) {
    console.log('Scraper & downloader MediaFire');
    console.log('Pemakaian: node scrape-mediafiredl.js <url> [url2 ...] [--out <dir>] [--no-download]');
    return;
  }

  if (!args.urls.length) {
    console.error('Error: URL MediaFire wajib diberikan. Contoh:');
    console.error(
      '  node scrape-mediafiredl.js "https://www.mediafire.com/file/y18iuhk9yjqo2vq/DIONYSUS+1200++FEATURE+PLUGINS.zip/file"'
    );
    process.exit(2);
  }

  (async () => {
    const results = [];
    const failures = [];

    for (let i = 0; i < args.urls.length; i++) {
      const url = args.urls[i];
      try {
        const result = await scrapeMediafire(url, {
          outDir: args.out,
          download: !args.noDownload,
        });
        results.push(result);
        printHuman(result, args.urls.length > 1 ? i + 1 : 0);
      } catch (err) {
        const msg = `${url} -> ${err.message}`;
        failures.push({ url, message: err.message });
        console.error(`\n[GAGAL ${i + 1}/${args.urls.length}] ${msg}`);
        results.push({ url, error: err.message });
      }
    }

    if (args.urls.length) console.log('');
    console.log('===== JSON =====');
    console.log(JSON.stringify(results, null, 2));

    process.exitCode = failures.length ? 1 : 0;
  })().catch((err) => {
    console.error('Error tak terduga: ' + (err.stack || err.message));
    process.exit(1);
  });
}

main();
