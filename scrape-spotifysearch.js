#!/usr/bin/env node

/**
 * Name : Spotify Search
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web :https://spotmp3.net
 * Type : Scraper
 * Description : Cari lagu spotify berdadarkan query/pencarian
Note : btw Error fix sendiri
 */

'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

/* ------------------------------------------------------------------ */
/* Konfigurasi                                                          */
/* ------------------------------------------------------------------ */

const BASE_URL = 'https://spotmp3.net';
const API_SEARCH = `${BASE_URL}/api/v1/search`;
const API_HOME = `${BASE_URL}/`;

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT = 25000; // ms per request
const BACKOFF_BASE_MS = 1500; // delay awal retry
const BACKOFF_CAP_MS = 30000; // delay retry maksimum

/** Urutan normalisasi section: track dulu, lalu artist, album, dst. */
const SECTION_ORDER = ['track', 'artist', 'album', 'playlist', 'podcast', 'episode', 'show'];

/* ------------------------------------------------------------------ */
/* Cookie jar otomatis (dibangun sendiri, tanpa cookie manual)           */
/* ------------------------------------------------------------------ */

const cookieJar = Object.create(null);
let warmed = false;

function storeCookies(res) {
  const raw =
    (res && res.headers && (res.headers['set-cookie'] || res.headers['Set-Cookie'])) || [];
  const list = Array.isArray(raw) ? raw : [raw];
  for (const line of list) {
    if (!line) continue;
    const pair = String(line).split(';')[0];
    const eq = pair.indexOf('=');
    if (eq > 0) {
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value && !/^expires=|delete$/i.test(name)) cookieJar[name] = value;
    }
  }
}

function cookieHeader() {
  const entries = Object.entries(cookieJar);
  if (!entries.length) return undefined;
  return entries.map(([k, v]) => `${k}=${v}`).join('; ');
}

function baseHeaders(extra) {
  const h = {
    'User-Agent': DEFAULT_UA,
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: `${BASE_URL}/`,
    Origin: BASE_URL,
    ...extra,
  };
  const ck = cookieHeader();
  if (ck) h.Cookie = ck;
  return h;
}

/** Dapatkan/segarkan cookie situs secara otomatis (1x GET homepage). */
async function warmCookies() {
  try {
    const res = await axios.get(API_HOME, {
      headers: baseHeaders({ Accept: 'text/html,application/xhtml+xml,*/*;' }),
      timeout: REQUEST_TIMEOUT,
      timeoutErrorMessage: `Timeout ${REQUEST_TIMEOUT}ms saat warm-up homepage`,
      validateStatus: null,
      maxRedirects: 5,
    });
    storeCookies(res);
    warmed = true;
    return warmed;
  } catch {
    warmed = true; // tetap lanjut, API terbukti bisa 200 tanpa cookie
    return true;
  }
}

/** Deteksi cepat interstitial/challenge Cloudflare atau halaman HTML tak terduga. */
function looksLikeChallenge(htmlText) {
  if (!htmlText) return false;
  const t = String(htmlText).slice(0, 4000);
  const $ = cheerio.load(String(htmlText));
  const title = ($('title').first().text() || '').toLowerCase();
  const keywords = [
    'just a moment',
    'attention required',
    'challenge platform',
    'cf-chl',
    'security check',
    'checking your browser',
    'rate limited',
  ];
  return keywords.some((k) => k && t.toLowerCase().includes(k)) || keywords.some((k) => title.includes(k));
}

/* ------------------------------------------------------------------ */
/* Util                                                                 */
/* ------------------------------------------------------------------ */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, Math.min(ms, BACKOFF_CAP_MS)));
}

function clampNumber(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(v)));
}

/** 226597 -> "3:46"  (>=1 jam -> "1:04:22") */
function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Core: 1 request search dengan retry "tidak menyerah"                 */
/* ------------------------------------------------------------------ */

/**
 * GET /api/v1/search?q=..&offset=..
 * Mengembalikan body JSON, atau melempar Error setelah maxRetries.
 * @param {string} query
 * @param {number} offset
 * @param {{maxRetries?: number}} opts  maxRetries=Infinity -> tidak pernah berhenti
 */
async function searchRequest(query, offset = 0, opts = {}) {
  const maxRetries = opts.maxRetries !== undefined ? opts.maxRetries : Infinity;
  const provider = opts.provider || 'spotify';
  const params = { q: query };
  if (offset > 0) params.offset = offset;
  if (provider === 'apple_music') {
    params.provider = 'apple_music';
    params.storefront = 'us';
  }

  let attempt = 0;
  let lastErr = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    try {
      // Warm-up cookie & sinkronisasi waktu pada percobaan pertama (bypass otomatis)
      if (!warmed) {
        await warmCookies();
        await sleep(250);
      }

      const res = await axios.get(API_SEARCH, {
        baseURL: BASE_URL,
        params,
        headers: baseHeaders(),
        timeout: REQUEST_TIMEOUT,
        timeoutErrorMessage: `Timeout ${REQUEST_TIMEOUT}ms pada search API`,
        validateStatus: null,
        responseType: 'text',
        maxRedirects: 5,
      });

      storeCookies(res);

      const contentType = String(res.headers['content-type'] || '');
      const bodyText = res.data;

      // Jika maxRedirects=0 sekali lagi di sini tidak memengaruhi perilaku
      if (res.status === 403 || res.status === 429 || contentType.includes('text/html')) {
        const challenge = looksLikeChallenge(bodyText);
        if (challenge || res.status === 403 || res.status === 429) {
          // bypass otomatis: refresh cookie lalu coba lagi
          warmed = false;
          await warmCookies();
        }
        throw new Error(
          `HTTP ${res.status}${challenge ? ' (Cloudflare/challenge page)' : ''}${contentType.includes('text/html') ? ' (HTML response)' : ''}`,
          challenge ? { retryable: true } : {}
        );
      }

      let json;
      try {
        json = typeof bodyText === 'string' ? JSON.parse(bodyText) : bodyText;
      } catch {
        throw new Error(`Respon bukan JSON valid (HTTP ${res.status})`);
      }

      if (res.status >= 500) throw new Error(`HTTP ${res.status} (server error)`);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      if (!json || typeof json !== 'object') throw new Error('JSON tidak valid');

      // Validasi struktur minimal
      if (!('sections' in json) && !('items' in json)) {
        throw new Error('Respons API tanpa "sections"/"items"');
      }
      return json;
    } catch (err) {
      lastErr = err;

      const netIssue =
        !err.response &&
        (err.code === 'ECONNRESET' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'ECONNABORTED' ||
          err.code === 'EAI_AGAIN' ||
          err.code === 'ECONNREFUSED' ||
          err.code === 'ENOTFOUND' ||
          err.code === 'EPROTO' ||
          /timeout|aborted|network/i.test(err.message || ''));

      const httpIssue =
        err.message &&
        (/^HTTP (5\d\d|429|403)/.test(err.message) ||
          /cloudflare|HTML response|Respon bukan JSON|tidak valid|tanpa/i.test(err.message));

      const retryable = netIssue || httpIssue || /^HTTP (403|429|5\d\d)/.test(err.message || '');

      if (!retryable) throw err;

      if (attempt > maxRetries) break;

      // Backoff eksponensial (2^n), hormati Retry-After header bila ada
      let wait = BACKOFF_BASE_MS * Math.pow(2, Math.min(attempt, 5) - 1);
      const ra = Number(err.headers && err.headers['retry-after']);
      if (Number.isFinite(ra) && ra > 0) wait = Math.max(wait, ra * 1000);

      // Deteksi header Retry-After axios (403/429 harus lewat err.response)
      process.stderr.write(
        `[retry #${attempt}] ${err.code || 'ERR'} ${err.message} -> tunggu ${Math.round(wait / 1000)}s\n`
      );
      await sleep(wait);
    }
  }
  throw lastErr || new Error('Search gagal tanpa pesan error');
}

/* ------------------------------------------------------------------ */
/* Pagination per-section                                               */
/* ------------------------------------------------------------------ */

async function paginateSection(query, type, initial, targetTotal, opts) {
  const rows = Array.isArray(initial.items) ? initial.items.slice() : [];
  const maxPages = opts.maxPages ? Math.max(1, opts.maxPages) : Infinity;
  let next = initial.next_offset;
  let page = 1;

  while (next != null && rows.length < targetTotal && page < maxPages) {
    const more = await searchRequest(query, next, opts);
    let matched = null;
    if (more && Array.isArray(more.sections)) {
      matched = more.sections.find((s) => s && s.type === type);
      if (!matched && more.sections.length) matched = more.sections[0];
    }
    if (!matched || !Array.isArray(matched.items) || matched.items.length === 0) break;

    // cegah duplikat (berdasarkan id) agar offset ganda tidak merusak mapping
    const seen = new Set(rows.map((r) => r.id));
    for (const it of matched.items) if (!seen.has(it.id)) rows.push(it);

    next = matched.next_offset != null ? matched.next_offset : null;
    page += 1;
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Mapping hasil -> format output yang diminta                          */
/* ------------------------------------------------------------------ */

function mapItem(item, fallbackType) {
  const type = (item.type || fallbackType || 'track').toLowerCase();

  const artist =
    item.subtitle != null
      ? String(item.subtitle)
          .split(/[·•]\s*/) // subtitle album: "Artist · 2022"
          .filter(Boolean)[0]
          .trim()
      : null;

  // Nama album: hanya tersedia pada item bertipe "album" (title-nya sendiri).
  // API engine TIDAK menyertakan nama album pada item track/artist.
  const album = type === 'album' ? item.title || null : item.album || null;

  return {
    type,
    title: item.title || null,
    artist: item.subtitle != null ? artist : null,
    album,
    duration: item.duration_ms != null ? formatDuration(item.duration_ms) : null,
    duration_ms: item.duration_ms ?? null,
    artwork_url: item.cover || item.thumbnail || null,
    thumbnail_url: item.thumbnail || null,
    source_url: item.url || (item.id && type === 'track' ? `https://open.spotify.com/track/${item.id}` : null),
    track_id: item.id ?? null,
    total_tracks: item.total_tracks ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

/**
 * Scrape pencarian musik SpotMP3.
 * @param {string} query  kata kunci pencarian (judul / artis / album)
 * @param {object} [opts]
 * @param {number} [opts.limit]          maksimum item global (default 40)
 * @param {number} [opts.maxPages]       halaman maksimum per-section (default 5)
 * @param {string} [opts.provider]       'spotify' (default) | 'apple_music'
 * @param {number} [opts.maxRetries]     Infinity (default) -> tidak menyerah
 * @returns {Promise<object>} hasil JSON sesuai format yang diminta
 */
async function search(query, opts = {}) {
  const q = String(query || '').trim();
  if (!q) {
    return {
      status: false,
      query: '',
      result_count: 0,
      results: [],
      message: 'Query kosong. Contoh: node scrape-spotifysearch.js "night changes"',
    };
  }

  const limit = clampNumber(opts.limit == null ? 40 : opts.limit, 1, 200, 40);
  const maxPages = opts.maxPages == null ? 5 : Number(opts.maxPages);
  const provider = opts.provider === 'apple_music' ? 'apple_music' : 'spotify';
  const maxRetries = opts.maxRetries !== undefined ? opts.maxRetries : Infinity;

  const runOpts = { provider, maxPages, maxRetries };

  let data;
  const t0 = Date.now();
  try {
    data = await searchRequest(q, 0, runOpts);
  } catch (err) {
    return {
      status: false,
      query: q,
      result_count: 0,
      results: [],
      message: `Pencarian gagal: ${err.message}`,
      elapsed_ms: Date.now() - t0,
    };
  }

  const sectionsIn = Array.isArray(data.sections) ? data.sections : [];
  const direct = Array.isArray(data.items) ? data.items : [];

  /** Flatten: urutkan section (track -> artist -> album -> dll), lalu paginate. */
  const sorted = sectionsIn
    .slice()
    .sort((a, b) => {
      const ia = SECTION_ORDER.indexOf(a.type);
      const ib = SECTION_ORDER.indexOf(b.type);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

  const out = [];
  for (const sec of sorted) {
    if (out.length >= limit) break;
    if (!sec || !Array.isArray(sec.items)) continue;

    let rows;
    try {
      rows = await paginateSection(q, sec.type, sec, sec.total == null ? maxPages * 20 : sec.total, runOpts);
    } catch {
      // section gagal paginate: pakai data pertama saja
      rows = sec.items;
    }

    for (const item of rows) {
      if (out.length >= limit) break;
      out.push(mapItem(item, sec.type));
    }
  }

  // Kasus URL/resolve: top-level items (tanpa section)
  if (out.length === 0 && direct.length) {
    for (const item of direct) out.push(mapItem(item, item.type || 'track'));
  }

  // Urutan hasil pencarian (position): nomor urut global, 1-based
  out.forEach((r, i) => {
    r.position = i + 1;
  });

  return {
    status: true,
    query: q,
    search_type: data.type || 'search',
    provider,
    crawl_ms: Date.now() - t0,
    result_count: out.length,
    results: out,
    sections: sorted.map((s) => ({
      type: s.type,
      total: s.total == null ? null : s.total,
      fetched: out.filter((r) => r.type === s.type).length,
    })),
    page: 1,
    limit,
  };
}

/** Module-level alias agar integrasi mudah */
async function scrapeSpotmp3Search(query, opts) {
  return search(query, opts);
}

/* ------------------------------------------------------------------ */
/* CLI                                                                  */
/* ------------------------------------------------------------------ */

function printUsage() {
  const p = path.basename(process.argv[1] || 'scrape-spotifysearch.js');
  process.stderr.write(
    `Pemakaian: node ${p} "<query>" [opsi]
Opsi:
  --limit N        max item global (default 40)
  --pages N        max halaman per-section (default 5)
  --provider X     spotify (default) | apple_music
  --out [path]     file output JSON (default: result.json)
  --quiet          tanpa log progress ke stderr
`
  );
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--limit':
        args.limit = Number(argv[++i]);
        break;
      case '--pages':
        args.pages = Number(argv[++i]);
        break;
      case '--provider':
        args.provider = argv[++i];
        break;
      case '--out':
        if (argv[i + 1] && !argv[i + 1].startsWith('--')) args.out = argv[++i];
        else args.out = 'result.json';
        break;
      case '--quiet':
        args.quiet = true;
        break;
      case '--help':
        args.help = true;
        break;
      default:
        if (a.startsWith('--')) throw new Error(`Opsi tidak dikenal: ${a}`);
        args._.push(a);
    }
  }
  return args;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`Error: ${e.message}\n`);
    process.exit(1);
  }

  if (args.help || !args._.length) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  const quiet = !!args.quiet;
  const progress = (msg) => !quiet && process.stderr.write(`[scraper] ${msg}\n`);

  const limit = Number.isFinite(args.limit) ? args.limit : undefined;
  const maxPages = Number.isFinite(args.pages) ? args.pages : undefined;
  const outPath = args.out != null ? args.out : 'result.json';

  let attempt = 0;
  let result = null;
  // Anti-stop: CLI default tanpa batas retry (barus per-user "jangan berhenti").
  const maxRetries = Number.isFinite(process.env.SCRAPER_MAX_RETRIES)
    ? Number(process.env.SCRAPER_MAX_RETRIES)
    : Infinity;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    try {
      result = await search(args._[0], { limit, maxPages, provider: args.provider, maxRetries });
      if (result && result.status) break;
      progress(`percobaan ke-${attempt}: status=false (${result && result.message}); mencoba lagi...`);
      await sleep(BACKOFF_BASE_MS * Math.pow(2, Math.min(attempt, 5)));
    } catch (err) {
      progress(`percobaan ke-${attempt} err: ${err.message}; mencoba lagi...`);
      await sleep(BACKOFF_BASE_MS * Math.pow(2, Math.min(attempt, 5)));
    }
  }

  const json = JSON.stringify(result, null, 2);

  // Tulis result.json (wajib) + JANGAN gagalkan eksekusi jika disk tidak bisa ditulis
  try {
    fs.writeFileSync(outPath, `${json}\n`, 'utf8');
    progress(`Hasil tersimpan ke ${path.resolve(outPath)}`);
  } catch (e) {
    process.stderr.write(`Peringatan: gagal menulis ${outPath}: ${e.message}\n`);
  }

  process.stdout.write(`${json}\n`);
  process.exit(0);
}

if (require.main === module) {
  main().catch((e) => {
    process.stderr.write(`Fatal: ${e && e.message}\n`);
    process.exit(1);
  });
}

/* ------------------------------------------------------------------ */
/* Exports                                                              */
/* ------------------------------------------------------------------ */

module.exports = {
  search, // fungsi utama
  scrapeSpotmp3Search, // alias integration-friendly
  formatDuration,
  cookieJar,
  constants: { BASE_URL, API_SEARCH },
};
