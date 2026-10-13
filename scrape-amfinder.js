#!/usr/bin/env node
'use strict';

/**
 * Name : AM finder (scrape web sendiri jir 😂)
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://xzeerhpreset-amfinder.vercel.app
 * Type : CJS
 * Description : Temukan preset alight motion dari deskripsi sampai kolom komentar. cocok bagi yang kaum mager yang salin preset di deskripsi serta mager mencari preset yang udah jauh dari jangkauan.
 * Note : error fix sendiri
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://xzeerhpreset-amfinder.vercel.app';
const FIND_ENDPOINT = BASE_URL + '/api/find';
const DEFAULT_OUT = path.join(process.cwd(), 'amfinder-output.json');

const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const HTML_ACCEPT =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
const JSON_ACCEPT = 'application/json,text/plain,*/*';

const SOURCE_LABEL = {
  description: 'Dari deskripsi',
  bio: 'Dari bio',
  bioLink: 'Dari link bio',
  comment: 'Dari komentar',
};

const STOPWORDS = new Set([
  'yang', 'dan', 'untuk', 'dari', 'dengan', 'ini', 'itu', 'di', 'ke', 'the',
  'and', 'for', 'you', 'your', 'gue', 'aku', 'kamu', 'ada', 'bisa', 'biar',
  'link', 'ini', 'aja', 'saja', 'nya', 'yang', 'pake', 'pakai', 'sama', 'dah',
  'udah', 'buka', 'cek', 'dulu', 'juga', 'kalau', 'kalo', 'biar', 'bikin',
]);

function parseArgs(argv) {
  const opts = {
    urls: [],
    file: null,
    out: DEFAULT_OUT,
    cookie: null,
    retries: 3,
    timeout: 60000,
    delay: 1500,
    filter: null,
    demo: false,
    pretty: 2,
  };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = () => args[++i];
    switch (a) {
      case '-h':
      case '--help':
        opts.help = true;
        break;
      case '--url':
        opts.urls.push(String(next() || '').trim());
        break;
      case '--file':
        opts.file = next();
        break;
      case '--out':
      case '-o':
        opts.out = next();
        break;
      case '--cookie':
        opts.cookie = next();
        break;
      case '--filter':
        opts.filter = (next() || '').toLowerCase();
        break;
      case '--retries':
        opts.retries = Math.max(1, parseInt(next(), 10) || 3);
        break;
      case '--timeout':
        opts.timeout = Math.max(5000, parseInt(next(), 10) || 60000);
        break;
      case '--delay':
        opts.delay = Math.max(0, parseInt(next(), 10) || 0);
        break;
      case '--demo':
        opts.demo = true;
        break;
      case '--compact':
        opts.pretty = 0;
        break;
      default:
        if (/^https?:\/\//i.test(a)) opts.urls.push(a.trim());
        else if (a.trim()) opts.urls.push(a.trim());
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
Alight Motion Preset Finder Scraper
Target  : ${BASE_URL}

Pemakaian:
  node scrape-amfinder.js <url-tiktok> [url-lain ...] [opsi]

Opsi:
  --url <url>        Tambahkan URL TikTok (boleh dipakai berulang)
  --file <path>      Baca daftar URL dari file (satu URL per baris)
  --out, -o <path>   Path file output JSON (default: ./amfinder-output.json)
  --cookie <am_c=..> Pakai cookie am_c manual (lewati langkah challenge)
  --filter <kata>    Tampilkan/ tandai hanya preset yang cocok kata kunci
  --retries <n>      Jumlah percobaan saat gagal (default: 3)
  --timeout <ms>     Timeout request (default: 60000)
  --delay <ms>       Jeda antar URL, sopan ke server (default: 1500)
  --demo             Jalankan dengan contoh URL TikTok
  --compact          Output JSON tanpa indentasi
  -h, --help         Tampilkan bantuan

Contoh:
  node scrape-amfinder.js "https://www.tiktok.com/@user/video/123"
  node scrape-amfinder.js --file urls.txt --out hasil.json --filter shake
`.trim());
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function createClient(timeout) {
  return axios.create({
    timeout,
    maxRedirects: 5,
    validateStatus: () => true,
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
    },
  });
}

function extractCookieValue(raw) {
  if (!raw) return null;
  const m = String(raw).match(/am_c=([^;"'\s]+)/);
  return m ? 'am_c=' + m[1] : null;
}

async function fetchCookie(client, knownHeader) {
  const res = await client.get(BASE_URL + '/', { headers: { Accept: HTML_ACCEPT } });
  const setCookie = res.headers && res.headers['set-cookie'];
  if (Array.isArray(setCookie)) {
    const hit = setCookie.find((c) => c.startsWith('am_c='));
    const fromHeader = extractCookieValue(hit);
    if (fromHeader) return fromHeader;
  }
  const body = typeof res.data === 'string' ? res.data : '';
  const $ = cheerio.load(body);
  const scriptText = $('script')
    .map((_, el) => $(el).html() || '')
    .get()
    .join('\n');
  const found = extractCookieValue(scriptText) || extractCookieValue(body);
  if (found) return found;
  throw new Error(
    `Gagal mengambil cookie am_c (HTTP ${res.status}). Coba lagi atau isi --cookie manual.`
  );
}

async function callFind(client, tiktokUrl, cookie) {
  const res = await client.get(FIND_ENDPOINT, {
    params: { url: tiktokUrl },
    headers: { Accept: JSON_ACCEPT, Cookie: cookie, Referer: BASE_URL + '/' },
  });
  let json = null;
  if (res.data && typeof res.data === 'object') {
    json = res.data;
  } else if (typeof res.data === 'string') {
    try {
      json = JSON.parse(res.data);
    } catch {
      json = null;
    }
  }
  return { status: res.status, json, raw: res.data };
}

async function findWithRetry(client, tiktokUrl, opts) {
  let cookie = opts.cookie || (await fetchCookie(client));
  let lastError = null;
  for (let attempt = 1; attempt <= opts.retries; attempt++) {
    try {
      const { status, json } = await callFind(client, tiktokUrl, cookie);
      const cookieProblem =
        status === 401 ||
        status === 403 ||
        (json && json.ok === false && /cookie/i.test(String(json.error || '')));
      if (cookieProblem) {
        cookie = await fetchCookie(client, cookie);
        lastError = new Error(`Cookie ditolak server (HTTP ${status}), menyegarkan cookie.`);
        await sleep(500);
        continue;
      }
      if (!json || typeof json !== 'object') {
        lastError = new Error(`Respons server tidak valid (HTTP ${status}).`);
        await sleep(600);
        continue;
      }
      if (json.ok === false) {
        const err = new Error(json.error || 'Server mengembalikan ok=false');
        err.serverMessage = true;
        throw err;
      }
      return json;
    } catch (e) {
      lastError = e;
      if (e.serverMessage) throw e;
      if (attempt < opts.retries) await sleep(700 * attempt);
    }
  }
  throw lastError || new Error('Gagal mengambil data setelah beberapa percobaan.');
}

function cleanText(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function splitTokens(text) {
  return cleanText(text)
    .toLowerCase()
    .split(/[^a-z0-9#_]+/i)
    .map((t) => t.trim())
    .filter(Boolean);
}

function extractTags(...texts) {
  const joined = texts.map(cleanText).join(' ');
  const tags = joined.match(/#[\p{L}\p{N}_]+/gu) || [];
  return [...new Set(tags.map((t) => t.toLowerCase()))];
}

function extractKeywords(...texts) {
  const joined = texts.map(cleanText).join(' ').replace(/#[\p{L}\p{N}_]+/gu, ' ');
  const words = splitTokens(joined).filter(
    (w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w)
  );
  return [...new Set(words)];
}

function normalizePreset(p) {
  const type = p.type === '5mb' ? '5mb' : p.type === 'xml' ? 'xml' : p.type || 'unknown';
  const name = cleanText(p.title) || (type === '5mb' ? 'Preset Alight Motion' : 'File preset');
  return {
    name,
    description: cleanText(p.detail) || (p.source ? SOURCE_LABEL[p.source] || '' : ''),
    type,
    format: type === '5mb' ? '5MB (Alight Motion project)' : type === 'xml' ? 'XML' : null,
    keywords: extractKeywords(name, p.detail, type),
    tags: extractTags(name, p.detail),
    url: p.url || null,
    thumbnail: p.thumb || null,
    source: p.source || null,
    sourceLabel: p.source ? SOURCE_LABEL[p.source] || p.source : null,
    detail: p.detail || null,
    byAuthor: !!p.byAuthor,
    pinned: !!p.pinned,
  };
}

function normalizeResult(inputUrl, data) {
  const video = data.video || {};
  const author = data.author || {};
  const scanned = data.scanned || {};
  const presetsRaw = Array.isArray(data.presets) ? data.presets : [];
  const presets = presetsRaw.map(normalizePreset);
  const caption = cleanText(video.description);

  return {
    sourceUrl: video.url || inputUrl,
    inputUrl,
    videoId: data.videoId || video.id || null,
    name: presets.length === 1 ? presets[0].name : `${presets.length} preset ditemukan`,
    caption,
    description: caption,
    tags: extractTags(caption),
    keywords: extractKeywords(caption),
    thumbnail: video.cover || null,
    preview: {
      cover: video.cover || null,
      embed: video.embed || null,
      src: video.src || null,
      proxy: video.proxy || null,
      srcFrom: video.srcFrom || null,
      playable: !!video.src,
    },
    stats: {
      views: video.views ?? null,
      likes: video.likes ?? null,
      comments: video.comments ?? null,
      shares: video.shares ?? null,
      createTime: video.createTime ?? null,
    },
    author: {
      uniqueId: author.uniqueId || null,
      nickname: author.nickname || null,
      avatar: author.avatar || null,
      bio: author.bio || null,
      bioLink: author.bioLink || null,
    },
    scanned: {
      comments: scanned.comments ?? 0,
      replies: scanned.replies ?? 0,
    },
    presetCount: presets.length,
    hasResults: presets.length > 0,
    presets,
    commentPresets: presets.filter((p) => p.source === 'comment'),
  };
}

function applyFilter(result, filter) {
  if (!filter) return result;
  const hit = (p) =>
    [p.name, p.description, p.type, p.url, p.detail, ...(p.keywords || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(filter);
  const matched = result.presets.filter(hit);
  return {
    ...result,
    filter,
    matchedCount: matched.length,
    matchedPresets: matched,
  };
}

async function run() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    return;
  }

  let urls = opts.urls.filter(Boolean);
  if (opts.file) {
    try {
      const content = fs.readFileSync(opts.file, 'utf8');
      urls = urls.concat(
        content
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith('#'))
      );
    } catch (e) {
      console.error(`Gagal membaca file ${opts.file}: ${e.message}`);
      process.exitCode = 1;
      return;
    }
  }
  if (opts.demo && urls.length === 0) {
    urls.push('https://www.tiktok.com/@pura2waras91/video/7692760775680822549');
  }
  urls = [...new Set(urls)];

  if (urls.length === 0) {
    printHelp();
    console.error('\nTidak ada URL yang diberikan.');
    process.exitCode = 1;
    return;
  }

  const client = createClient(opts.timeout);
  const results = [];
  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Mencari preset: ${url}`);
    try {
      const data = await findWithRetry(client, url, opts);
      const normalized = applyFilter(normalizeResult(url, data), opts.filter);
      results.push(normalized);
      const note = normalized.filter
        ? `${normalized.matchedCount}/${normalized.presetCount} preset cocok "${normalized.filter}"`
        : `${normalized.presetCount} preset`;
      console.log(
        `    ok: @${normalized.author.uniqueId || '-'} | ${note} | ` +
          `dicek ${normalized.scanned.comments} komentar + ${normalized.scanned.replies} balasan`
      );
    } catch (e) {
      console.error(`    gagal: ${e.message}`);
      errors.push({ inputUrl: url, error: e.message });
    }
    if (i < urls.length - 1 && opts.delay) await sleep(opts.delay);
  }

  const output = {
    meta: {
      generator: 'scrape-amfinder.js',
      target: BASE_URL,
      generatedAt: new Date().toISOString(),
      requested: urls.length,
      succeeded: results.length,
      failed: errors.length,
      totalPresets: results.reduce((n, r) => n + r.presetCount, 0),
    },
    results,
    errors,
  };

  const jsonOut = opts.pretty
    ? JSON.stringify(output, null, opts.pretty)
    : JSON.stringify(output);
  fs.writeFileSync(opts.out, jsonOut, 'utf8');

  console.log(`\nSelesai. ${results.length}/${urls.length} URL berhasil, ${errors.length} gagal.`);
  console.log(`Output: ${path.resolve(opts.out)}`);
  if (errors.length) process.exitCode = 2;
}

run().catch((e) => {
  console.error('Fatal:', e.message);
  process.exitCode = 1;
});