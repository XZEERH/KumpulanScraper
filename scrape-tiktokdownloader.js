/**
 * Name : Tiktok downloader
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/apps : https://tikdown(.)com
 * Type : Scraper/JSON
 * Method : GET
 * Description : 
Note : 
 */

#!/usr/bin/env node
'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');

/* ---------------------------------------------------------------------------
 * Konstanta
 * ------------------------------------------------------------------------- */

const TIKDOWN_BASE = 'https://tikdown.com';
const TIKDOWN_EXTRACT = '/api/extract.php';
const TIKDOWN_PROGRESS = '/api/progress.php';

const CLIP_BASE = 'https://clipssaver.com';
const CLIP_TOKEN = '/api/token';
const CLIP_VIDEO_DETAIL = '/api/tiktok/video-detail';
const CLIP_STORY_VIEWER = '/api/tiktok/story-viewer';

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const DEFAULTS = {
  timeout: 30000,          // timeout per HTTP request (ms)
  maxExtractRetries: 5,    // percobaan ulang extract (cooldown/csrf/network)
  maxProgressTries: 60,    // polling progress maksimal (~4-5 menit)
  maxNetworkRetries: 2,    // retry utk error jaringan/5xx
};

/** Pesan ramah untuk kode error dari TikDown. */
const ERROR_MESSAGES = {
  INVALID_URL: 'URL tidak valid. Masukkan tautan postingan TikTok (video, photo, atau story).',
  NOT_A_VIDEO_URL: 'URL bukan tautan postingan TikTok (cont: profil, hashtag, atau halaman lain).',
  URL_TOO_LONG: 'URL terlalu panjang.',
  WRONG_SERVICE: 'Layanan ini hanya mendukung tautan TikTok.',
  NOT_MEDIA: 'URL tidak mengarah ke media apa pun.',
  PLAYLIST_NOT_SUPPORTED: 'Playlist tidak didukung. Gunakan tautan satu postingan.',
  VIDEO_DELETED_OR_PRIVATE: 'Video sudah dihapus atau bersifat privat.',
  VIDEO_NOT_FOUND: 'Video tidak ditemukan / sudah dihapus.',
  MEDIA_UNAVAILABLE: 'Media tidak tersedia.',
  VIDEO_REGION_RESTRICTED: 'Video tidak tersedia di wilayah ini.',
  VIDEO_AGE_RESTRICTED: 'Video dibatasi usia.',
  VIDEO_SELF_ONLY: 'Video privat (hanya terlihat oleh pemiliknya).',
  VIDEO_UNDER_REVIEW: 'Video sedang ditinjau. Coba lagi nanti.',
  AUTHOR_DELETED: 'Akun pembuat konten sudah dihapus.',
  USER_NOT_FOUND: 'Pengguna tidak ditemukan.',
  CAPTCHA_REQUIRED: 'Server meminta verifikasi captcha. Coba lagi beberapa saat lagi.',
  CAPTCHA: 'Verifikasi captcha diperlukan. Coba lagi beberapa saat lagi.',
  MAINTENANCE: 'Server sedang pemeliharaan. Coba lagi nanti.',
  UPSTREAM_UNREACHABLE: 'Server pemroses tidak dapat dihubungi.',
  UPSTREAM_ERROR: 'Server gagal memproses. Coba tautan lain atau ulangi.',
  API_ERROR: 'Terjadi kesalahan server. Coba lagi nanti.',
  FETCH_ERROR: 'Gagal mengambil data video. Coba lagi sebentar.',
  RATE_LIMIT: 'Terlalu sering. Tunggu beberapa detik lalu ulangi.',
  NO_MEDIA: 'Tidak ada media yang ditemukan pada postingan ini.',
};

/* ---------------------------------------------------------------------------
 * Util umum
 * ------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jitter = (ms) => ms + Math.floor(Math.random() * 300);

function isNetworkError(err) {
  const code = String((err && (err.code || err.cause && err.cause.code)) || '');
  return (
    code === 'ECONNRESET' || code === 'ECONNABORTED' || code === 'ETIMEDOUT' ||
    code === 'EAI_AGAIN' || code === 'ENOTFOUND' || code === 'ECONNREFUSED' ||
    code === 'EPIPE' || /network/i.test(String(err && err.message))
  );
}

/** "24.23 MB" -> 25410885 (TikDown memakai MB = MiB). */
function parseSizeBytes(str) {
  if (str == null || str === '') return null;
  if (typeof str === 'number') return str;
  const m = String(str).trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  const mul = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 }[unit];
  return Number.isFinite(num) ? Math.round(num * mul) : null;
}

/** "00:00:52" -> 52. */
function parseDurationSeconds(str) {
  if (str == null || str === '') return null;
  if (typeof str === 'number') return str;
  const parts = String(str).trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => !Number.isFinite(p))) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** "4.4M" -> 4400000 ; "21.0K" -> 21000 ; "114" -> 114. */
function parseHumanCount(str) {
  if (str == null || str === '') return null;
  if (typeof str === 'number') return str;
  const m = String(str).trim().match(/^([\d.,]+)\s*([KMB])?$/i);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ''));
  if (!Number.isFinite(num)) return null;
  const mul = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1;
  return Math.round(num * mul);
}

/** "1080x1920" -> "1080p" */
function qualityLabelFromResolution(resolution, fallbackQuality) {
  if (resolution) {
    const m = String(resolution).match(/(\d+)\s*[xX]\s*(\d+)/);
    if (m) {
      const h = parseInt(m[1], 10);
      const w = parseInt(m[2], 10);
      const height = Math.min(h, w); // video vertikal: tinggi = sisi kecil
      if (Number.isFinite(height) && height > 0) return `${height}p`;
    }
  }
  const tier = { FHD: '1080p', HD: '720p', SD: '480p', QHD: '1440p' };
  if (fallbackQuality && tier[String(fallbackQuality).toUpperCase()]) {
    return tier[String(fallbackQuality).toUpperCase()];
  }
  return null;
}

/** Unix detik -> ISO 8601, atau null. */
function isoFromUnix(sec) {
  const n = parseInt(sec, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  try {
    return new Date(n * 1000).toISOString();
  } catch {
    return null;
  }
}

/** Buang parameter tracking dari URL TikTok. */
function stripTrackingParams(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.search = '';
    u.hash = '';
    // buang trailing slash ganda
    return u.toString().replace(/\/+$/, '');
  } catch {
    return rawUrl;
  }
}

/* ---------------------------------------------------------------------------
 * Klien TikDown (engine utama)
 * ------------------------------------------------------------------------- */

class TikDownClient {
  constructor(options = {}) {
    this.opts = { ...DEFAULTS, ...options };
    this.cookies = '';
    this.csrf = '';
    this.http = axios.create({
      timeout: this.opts.timeout,
      headers: { 'User-Agent': DESKTOP_UA, Accept: 'application/json' },
      // status apa pun diterima; kita evaluasi manual
      validateStatus: () => true,
    });
  }

  /** Ambil sesi baru (cookie csrfToken diset oleh server tikdown). */
  async newSession() {
    const res = await this.http.get(`${TIKDOWN_BASE}/id/`, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });
    const setCookies = res.headers['set-cookie'] || [];
    const pairs = setCookies.map((c) => c.split(';')[0]).filter(Boolean);
    this.cookies = pairs.join('; ');
    const m = this.cookies.match(/csrfToken=([^;]+)/);
    this.csrf = m ? decodeURIComponent(m[1]) : '';
    if (!this.cookies || !this.csrf) {
      throw new Error('Gagal mendapatkan sesi TikDown (csrfToken tidak ditemukan).');
    }
    return { cookies: this.cookies, csrf: this.csrf };
  }

  /** POST extract.php dengan penanganan cooldown/csrf/network. */
  async extract(url) {
    let lastError = null;

    for (let attempt = 0; attempt < this.opts.maxExtractRetries; attempt++) {
      if (!this.cookies || !this.csrf) {
        try { await this.newSession(); } catch (e) { lastError = e; }
      }

      let res;
      try {
        res = await this.http.post(
          `${TIKDOWN_BASE}${TIKDOWN_EXTRACT}`,
          { url },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': this.csrf,
              Cookie: this.cookies,
              Origin: TIKDOWN_BASE,
              Referer: `${TIKDOWN_BASE}/id/`,
            },
          },
        );
      } catch (err) {
        if (isNetworkError(err) && attempt < this.opts.maxExtractRetries - 1) {
          await sleep(jitter(2000 * (attempt + 1)));
          continue;
        }
        throw new Error(`Gagal menghubungi TikDown: ${err.message}`);
      }

      const data = res.data;
      if (!data) {
        lastError = new Error('Respons TikDown bukan JSON valid.');
        await sleep(jitter(1500));
        continue;
      }

      // sukses
      if (data.ok === true && data.result) return data.result;

      // cooldown / rate limit -> tunggu sesuai permintaan server lalu ulang
      if (
        (data.error === 'COOLDOWN' || data.error === 'RATE_LIMIT') &&
        typeof data.remainingSeconds === 'number'
      ) {
        const waitMs = (data.remainingSeconds + 1) * 1000;
        await sleep(Math.min(waitMs, 65000));
        continue;
      }

      // sesi kedaluwarsa -> perbarui cookie lalu ulang
      if (data.error === 'ERR_CSRF' || res.status === 403) {
        this.cookies = '';
        this.csrf = '';
        try { await this.newSession(); } catch { /* biarkan attempt berikutnya */ }
        continue;
      }

      // error upstream sementara -> backoff lalu ulang
      if (
        res.status >= 500 ||
        ['UPSTREAM_UNREACHABLE', 'UPSTREAM_ERROR', 'API_ERROR', 'FETCH_ERROR', 'MAINTENANCE'].includes(data.error)
      ) {
        lastError = this.mapApiError(data, res.status);
        await sleep(jitter(2500 * (attempt + 1)));
        continue;
      }

      // captcha: tidak bisa dilewati tanpa browser -> laporkan jelas
      throw this.mapApiError(data, res.status, url);
    }

    throw lastError || new Error('Extract TikDown gagal setelah beberapa percobaan.');
  }

  mapApiError(data, httpStatus, url) {
    const code = (data && data.error) || (httpStatus >= 500 ? 'UPSTREAM_ERROR' : 'UNKNOWN');
    const base = ERROR_MESSAGES[code] || (data && data.upstreamMessage) || 'Terjadi kesalahan tak terduga.';
    const err = new Error(base);
    err.code = code;
    if (url) err.url = url;
    if (data && data.upstreamMessage && ERROR_MESSAGES[code]) {
      err.detail = String(data.upstreamMessage).slice(0, 200);
    }
    return err;
  }

  /**
   * Polling progress.php sampai file final siap.
   * @returns {Promise<{url:string, fileName?:string, sizeBytes?:number}>}
   */
  async resolve(v5Url, { onProgress } = {}) {
    const backoff429 = [10000, 15000, 20000, 30000];
    let consec429 = 0;
    let consecErrors = 0;

    for (let tries = 1; tries <= this.opts.maxProgressTries; tries++) {
      let res;
      try {
        res = await this.http.post(
          `${TIKDOWN_BASE}${TIKDOWN_PROGRESS}`,
          { v5Url },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': this.csrf,
              Cookie: this.cookies,
              Origin: TIKDOWN_BASE,
              Referer: `${TIKDOWN_BASE}/id/`,
            },
          },
        );
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        consecErrors += 1;
        if (consecErrors >= 3) throw new Error('Koneksi ke server progres terputus berulang kali.');
        await sleep(jitter(2000));
        continue;
      }

      const data = res.data;

      // rate limit pada endpoint progres
      if (res.status === 429 || (data && (data.error === 'RATE_LIMIT' || data.error === 'COOLDOWN'))) {
        const delay = data && data.remainingSeconds
          ? (data.remainingSeconds + 1) * 1000
          : backoff429[Math.min(consec429++, backoff429.length - 1)];
        await sleep(delay);
        continue;
      }
      consec429 = 0;

      if (!data) {
        consecErrors += 1;
        if (consecErrors >= 3) throw new Error('Respons progres tidak valid.');
        await sleep(jitter(2000));
        continue;
      }
      consecErrors = 0;

      const state = String(data.status || '').toLowerCase();

      if (state === 'completed' && data.fileUrl && !/^(Waiting|In Processing)/i.test(String(data.fileUrl))) {
        return {
          url: data.fileUrl,
          fileName: data.fileName || undefined,
          sizeBytes: Number(data.fileSizeBytes) || Number(data.fileSize) || undefined,
          viewUrl: data.viewUrl || undefined,
        };
      }

      if (state === 'failed' || state === 'error' || state === 'expired') {
        throw new Error(`Pemrosesan media gagal di server (status: ${state}).`);
      }

      if (typeof onProgress === 'function') {
        try { onProgress(String(data.percent || data.progress || state || '')); } catch { /* noop */ }
      }

      // delay polling: cepat di awal, melambat saat antrean panjang
      const queuedDeep = state === 'queued' && Number(data.position) > 3;
      await sleep(jitter(tries <= 1 ? 1500 : queuedDeep ? 4500 : 2500));
    }

    throw new Error('Batas waktu polling progres tercapai.');
  }

  /** Apakah item media bisa diunduh langsung (tanpa polling)? */
  static isDirectItem(item) {
    const v5 = String((item && item.v5Url) || '');
    return (item && item.type === 'image') || v5.includes('/v5/download/');
  }
}

/* ---------------------------------------------------------------------------
 * Klien ClipsSaver (pelengkap metadata + deteksi story)
 * ------------------------------------------------------------------------- */

class ClipsClient {
  constructor(options = {}) {
    this.opts = { ...DEFAULTS, ...options };
    this.token = '';
    this.tokenAt = 0;
    this.http = axios.create({
      timeout: this.opts.timeout,
      headers: { 'User-Agent': DESKTOP_UA, Accept: 'application/json' },
      validateStatus: () => true,
    });
  }

  async #getToken(force = false) {
    const fiveHours = 5 * 60 * 60 * 1000;
    if (!force && this.token && Date.now() - this.tokenAt < fourHours(fiveHours)) {
      return this.token;
    }
    const res = await this.http.get(`${CLIP_BASE}${CLIP_TOKEN}`, {
      headers: { Referer: `${CLIP_BASE}/` },
    });
    const tok = res.data && res.data.token;
    if (!tok) return '';
    this.token = tok;
    this.tokenAt = Date.now();
    return this.token;
  }

  /** POST generik dengan header x-cs-tok; retry 401/403 dgn token baru. */
  async #post(apiPath, body) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await this.#getToken(attempt > 0);
      if (!token) return null;
      let res;
      try {
        res = await this.http.post(`${CLIP_BASE}${apiPath}`, body, {
          headers: {
            'Content-Type': 'application/json',
            'x-cs-tok': token,
            Origin: CLIP_BASE,
            Referer: `${CLIP_BASE}/`,
          },
        });
      } catch (err) {
        if (isNetworkError(err) && attempt === 0) { await sleep(1500); continue; }
        return null; // pelengkap: gagal = degrade, jangan gagalkan scraping
      }
      if (res.status === 401 || res.status === 403) continue; // token segar
      if (res.status === 429) return null;                     // kena limit -> degrade
      if (res.status >= 500) {
        if (attempt === 0) { await sleep(2000); continue; }
        return null;
      }
      return (res.data && res.data.success !== false && res.data) || null;
    }
    return null;
  }

  /** Detail lengkap satu postingan (author.id, createTime, stats, media). */
  async videoDetail(url) {
    const d = await this.#post(CLIP_VIDEO_DETAIL, { url });
    if (!d || d.exists === false) return null;
    return (d.data && d.data.itemStruct) || null;
  }

  /** Daftar story aktif milik sebuah username. */
  async storyViewer(username) {
    const d = await this.#post(CLIP_STORY_VIEWER, { username });
    return (d && d.data) || null;
  }
}

function fourHours(ms) { return ms - (60 * 60 * 1000); } // refresh 1 jam lebih awal

/* ---------------------------------------------------------------------------
 * Normalisasi URL TikTok
 * ------------------------------------------------------------------------- */

/**
 * @param {string} input
 * @returns {Promise<{canonical:string, pathType:'video'|'photo'|null,
 *                     postId:string|null, username:string|null}>}
 */
async function normalizeTikTokUrl(input) {
  let url = String(input || '').trim();
  if (!url) throw errCode('INVALID_URL', 'URL kosong.');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  let host = '';
  try {
    const u = new URL(url);
    host = u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    throw errCode('INVALID_URL', `URL tidak valid: ${input}`);
  }

  const isTikTok = /^(m\.|vm\.|vt\.)?tiktok\.com$/.test(host);
  if (!isTikTok) throw errCode('WRONG_SERVICE', 'URL bukan domain TikTok.');

  // short link (vt./vm./tiktok.com/t/...) -> ikuti redirect utk URL kanonik
  const isShort = /^(vt|vm)\./.test(host) || /tiktok\.com\/t\//i.test(url);
  if (isShort) {
    url = await followRedirects(url);
  }

  const m = url.match(/tiktok\.com\/@([A-Za-z0-9._-]+)\/(video|photo)\/(\d+)/i);
  if (!m) {
    throw errCode(
      'NOT_A_VIDEO_URL',
      'URL bukan tautan postingan TikTok yang didukung (@user/video/<id> atau @user/photo/<id>).',
    );
  }

  return {
    canonical: stripTrackingParams(url),
    pathType: m[2].toLowerCase(),
    postId: m[3],
    username: m[1],
  };
}

function errCode(code, message) {
  const e = new Error(message || ERROR_MESSAGES[code] || code);
  e.code = code;
  return e;
}

/** Ikuti rantai redirect short-link TikTok secara manual. */
async function followRedirects(url) {
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    const res = await axios.get(current, {
      maxRedirects: 0,
      timeout: DEFAULTS.timeout,
      headers: { 'User-Agent': DESKTOP_UA },
      validateStatus: () => true,
    });
    const loc = res.headers.location;
    if (!loc) break;
    current = new URL(loc, current).toString();
    if (/@[A-Za-z0-9._-]+\/(video|photo)\//.test(current)) break;
  }
  return current;
}

/* ---------------------------------------------------------------------------
 * Pemetaan hasil ke format output
 * ------------------------------------------------------------------------- */

function pickVideoQuality(item) {
  return (
    qualityLabelFromResolution(item.resolution, item.quality) ||
    (item.quality ? String(item.quality).toLowerCase() : null)
  );
}

/** Siapkan entry video dari satu mediaItem TikDown. */
async function buildVideoEntry(client, item, fallback) {
  const entry = {
    quality: pickVideoQuality(item),
    format: (item.extension || 'mp4').toLowerCase(),
    size: parseSizeBytes(item.fileSize),
    watermark: false,
    url: null,
  };
  try {
    if (TikDownClient.isDirectItem(item)) {
      entry.url = item.v5Url;
    } else {
      const solved = await client.resolve(item.v5Url);
      entry.url = solved.url;
      if (solved.sizeBytes) entry.size = solved.sizeBytes;
    }
  } catch (err) {
    // fallback: gunakan playAddr CDN web TikTok bila tersedia
    if (fallback && fallback.playAddr) {
      entry.url = fallback.playAddr;
      entry.quality =
        (fallback.width && fallback.height && `${Math.min(fallback.width, fallback.height)}p`) ||
        entry.quality;
    } else {
      return null;
    }
  }
  return entry.url ? entry : null;
}

/** Siapkan entry audio dari satu mediaItem TikDown. */
async function buildAudioEntry(client, item, fallback) {
  const entry = {
    format: (item.extension || 'mp3').toLowerCase(),
    url: null,
  };
  const bitrate = item.quality ? String(item.quality) : null;
  if (bitrate) entry.bitrate = bitrate;
  const dur = parseDurationSeconds(item.duration);
  if (dur != null) entry.duration = dur;
  const size = parseSizeBytes(item.fileSize);
  if (size != null) entry.size = size;

  try {
    if (TikDownClient.isDirectItem(item)) {
      entry.url = item.v5Url;
    } else {
      const solved = await client.resolve(item.v5Url);
      entry.url = solved.url;
      if (solved.sizeBytes) entry.size = solved.sizeBytes;
    }
  } catch (err) {
    if (fallback && fallback.playUrl) entry.url = fallback.playUrl;
    else return null;
  }
  return entry.url ? entry : null;
}

/** Siapkan entry gambar dari satu mediaItem TikDown. */
function buildImageEntry(item, index) {
  const res = String(item.resolution || '').match(/(\d+)\s*[xX]\s*(\d+)/);
  return {
    index: index + 1,
    format: (item.extension || 'jpg').toLowerCase(),
    width: res ? parseInt(res[1], 10) : null,
    height: res ? parseInt(res[2], 10) : null,
    size: parseSizeBytes(item.fileSize),
    url: item.v5Url || item.thumbnail || null,
  };
}

/** Resolusi item -> {width, height}. */
function dimsFromResolution(resolution) {
  const m = String(resolution || '').match(/(\d+)\s*[xX]\s*(\d+)/);
  return m ? { width: parseInt(m[1], 10), height: parseInt(m[2], 10) } : {};
}

/* ---------------------------------------------------------------------------
 * Scraper utama
 * ------------------------------------------------------------------------- */

/**
 * Scrape satu URL TikTok (video / photo / story).
 *
 * @param {string} inputUrl  URL TikTok apa pun (full, vt., vm., tiktok.com/t/)
 * @param {object} [options] { timeout, quiet }
 * @returns {Promise<object>} { status:true, data } | { status:false, error, message }
 */
async function scrapeTikTok(inputUrl, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const tikdown = new TikDownClient({ timeout: opts.timeout });
  const clips = new ClipsClient({ timeout: opts.timeout });

  // 1) Normalisasi + validasi URL ------------------------------------------------
  const norm = await normalizeTikTokUrl(inputUrl);

  // 2) Engine utama: TikDown extract --------------------------------------------
  const raw = await tikdown.extract(norm.canonical || String(inputUrl));
  // TikDown mengembalikan objek hasil langsung (bukan amplop { result }).
  const result = raw.result || raw;
  const mediaItems = Array.isArray(result.mediaItems) ? result.mediaItems : [];

  // 3) Enrichment ClipsSaver (best-effort; gagal = lanjut tanpa ini) -------------
  let detail = null;
  let storyEntry = null;
  try {
    detail = await clips.videoDetail(norm.canonical);
    if (norm.pathType === 'photo' && norm.username) {
      await sleep(500); // jeda kecil antar request agar tidak kena rate limit
      const sv = await clips.storyViewer(norm.username);
      if (sv && Array.isArray(sv.stories)) {
        storyEntry = sv.stories.find(
          (s) => String(s.id) === String(norm.postId) && s.is_story !== false,
        ) || null;
      }
    }
  } catch { /* degrade diam-diam */ }

  // 4) Deteksi tipe --------------------------------------------------------------
  const imagesItems = mediaItems.filter((it) => it.type === 'image');
  const videoItems = mediaItems.filter((it) => it.type === 'video');
  const audioItems = mediaItems.filter((it) => it.type === 'audio');

  let type;
  if (norm.pathType === 'video') {
    type = 'video';
  } else if (storyEntry) {
    type = 'story';
  } else if (imagesItems.length >= 1) {
    type = 'photo';
  } else if (videoItems.length >= 1) {
    // aturan fallback: story berupa video tunggal tanpa gambar di path /photo/
    type = 'story';
  } else {
    type = 'photo';
  }

  // 5) Data dasar ----------------------------------------------------------------
  const detailItem = detail || {};
  const detailAuthor = detailItem.author || {};
  const rawUser = result.user || {};
  const caption = (result.description || detailItem.desc || '').trim();
  const title = caption || result.title || '';
  const thumbnail =
    detailItem.video?.cover || result.thumbnail || detailItem.video?.originCover || null;

  const stats = { views: null, likes: null, comments: null, shares: null };
  const ds = detailItem.stats || {};
  if (ds.playCount != null) stats.views = Number(ds.playCount) || null;
  if (ds.diggCount != null) stats.likes = Number(ds.diggCount) || null;
  if (ds.commentCount != null) stats.comments = Number(ds.commentCount) || null;
  if (ds.shareCount != null) stats.shares = Number(ds.shareCount) || null;
  if (stats.views == null) stats.views = parseHumanCount(result.stats && result.stats.views);
  if (stats.likes == null) stats.likes = parseHumanCount(result.stats && result.stats.likes);

  const createTimeSec =
    storyEntry?.createTime ?? detailItem.createTime ?? null;
  const publishedAt = isoFromUnix(createTimeSec);

  const author = {
    username: rawUser.username || detailAuthor.uniqueId || norm.username || null,
    nickname: rawUser.name || detailAuthor.nickname || null,
    avatar: rawUser.avatar || detailAuthor.avatarLarger || null,
    id: detailAuthor.id || null,
  };

  const base = {
    platform: 'tiktok',
    type,
    id: result.id || norm.postId || null,
    url: String(inputUrl),
    canonical: norm.canonical || result.permanentLink || null,
    postId: result.id || norm.postId || null,
    contentType: type,
    title: title || null,
    caption: caption || null,
    publishedAt,
    author,
    thumbnail: thumbnail || null,
    stats,
  };

  // 6) Bangun bagian media sesuai tipe -------------------------------------------
  if (type === 'video') {
    const fbVideo = detailItem.video || {};
    const fbMusic = detailItem.music || {};

    const video = [];
    const sorted = [...videoItems].sort((a, b) => {
      const da = dimsFromResolution(a.resolution);
      const db = dimsFromResolution(b.resolution);
      return (db.width || 0) - (da.width || 0);
    });
    for (const it of sorted) {
      const entry = await buildVideoEntry(tikdown, it, fbVideo);
      if (entry) video.push(entry);
    }
    // versi watermark (downloadAddr CDN web TikTok) bila tersedia
    if (fbVideo.downloadAddr) {
      video.push({
        quality:
          qualityLabelFromResolution(null, fbVideo.ratio) ||
          (fbVideo.width && fbVideo.height ? `${Math.min(fbVideo.width, fbVideo.height)}p` : null),
        format: 'mp4',
        size: null,
        watermark: true,
        url: fbVideo.downloadAddr,
      });
    }

    const audio = [];
    for (const it of audioItems) {
      const entry = await buildAudioEntry(tikdown, it, fbMusic);
      if (entry) audio.push(entry);
    }

    const duration =
      parseDurationSeconds(videoItems[0] && videoItems[0].duration) ??
      (fbVideo.duration != null ? fbVideo.duration : null);

    return {
      status: true,
      data: {
        ...base,
        duration: duration ?? null,
        video,
        audio,
      },
    };
  }

  if (type === 'photo') {
    const fbMusic = detailItem.music || {};

    let images = imagesItems.map((it, i) => buildImageEntry(it, i));
    // fallback daftar gambar asli dari ClipsSaver bila TikDown tak memberikan
    if (images.every((im) => !im.url) && Array.isArray(detailItem.imagePost?.images)) {
      images = detailItem.imagePost.images.map((src, i) => ({
        index: i + 1,
        format: 'jpg',
        width: null,
        height: null,
        size: null,
        url: typeof src === 'string' ? src : (src.url || src.displayUrl || src.imageUrl || src.src || null),
      }));
    }

    let audio = null;
    if (audioItems[0]) {
      audio = await buildAudioEntry(tikdown, audioItems[0], fbMusic);
    }
    if (!audio && fbMusic.playUrl) {
      audio = {
        format: 'mp3',
        bitrate: null,
        duration: fbMusic.duration ?? null,
        size: null,
        url: fbMusic.playUrl,
      };
    }

    return {
      status: true,
      data: { ...base, images, audio },
    };
  }

  // type === 'story'
  const fbVideo = (storyEntry && storyEntry.media && storyEntry.media.video) || detailItem.video || {};
  const fbMusic = (storyEntry && storyEntry.music) || detailItem.music || {};

  const preferred =
    [...videoItems].sort((a, b) => {
      const da = dimsFromResolution(a.resolution);
      const db = dimsFromResolution(b.resolution);
      return (db.width || 0) - (da.width || 0);
    })[0] || null;

  let video = null;
  if (preferred) {
    video = await buildVideoEntry(tikdown, preferred, fbVideo);
    if (video) {
      const dur = parseDurationSeconds(preferred.duration);
      if (dur != null) video.duration = dur;
      if (fbVideo.width && fbVideo.height) {
        video.width = fbVideo.width;
        video.height = fbVideo.height;
      }
    }
  }
  if (!video && fbVideo.playAddr) {
    video = {
      quality:
        (fbVideo.width && fbVideo.height ? `${Math.min(fbVideo.width, fbVideo.height)}p` : null) ||
        qualityLabelFromResolution(preferred?.resolution, preferred?.quality),
      format: 'mp4',
      size: null,
      watermark: false,
      url: fbVideo.playAddr,
      duration: fbVideo.duration ?? null,
      width: fbVideo.width ?? null,
      height: fbVideo.height ?? null,
    };
  }

  let audio = null;
  if (audioItems[0]) {
    audio = await buildAudioEntry(tikdown, audioItems[0], fbMusic);
  }
  if (!audio && fbMusic.playUrl) {
    audio = { format: 'mp3', bitrate: null, duration: fbMusic.duration ?? null, size: null, url: fbMusic.playUrl };
  }

  const storyExpiresAt =
    (storyEntry && storyEntry.story_expires_at) ||
    (detailItem.story_expires_at || null);

  return {
    status: true,
    data: {
      ...base,
      storyExpiresAt: storyExpiresAt || null,
      video: video || null,
      audio: audio || null,
    },
  };
}

/* ---------------------------------------------------------------------------
 * CLI
 * ------------------------------------------------------------------------- */

function parseCliArgs(argv) {
  const urls = [];
  const flags = { out: 'result.json', timeout: DEFAULTS.timeout, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' || a === '-o') flags.out = argv[++i] || flags.out;
    else if (a === '--timeout' || a === '-t') flags.timeout = parseInt(argv[++i], 10) || DEFAULTS.timeout;
    else if (a === '--quiet' || a === '-q') flags.quiet = true;
    else if (a === '--help' || a === '-h') flags.help = true;
    else urls.push(a);
  }
  return { urls, flags };
}

function printHelp() {
  console.log(`
scrape-ttdownloader.js — TikTok scraper (video / photo / story)

Penggunaan:
  node scrape-ttdownloader.js <tiktok-url> [url2 ...] [--out result.json] [--timeout 30000] [--quiet]

Contoh:
  node scrape-ttdownloader.js "https://www.tiktok.com/@user/video/123456"
  node scrape-ttdownloader.js "https://vt.tiktok.com/xxxx/" "https://www.tiktok.com/@user/photo/123" --out hasil.json

Opsi:
  --out, -o FILE    Lokasi file hasil JSON (default: result.json)
  --timeout, -t MS  Timeout HTTP per request (default: 30000)
  --quiet, -q       Jangan cetak JSON ke stdout (file tetap ditulis)
  --help, -h        Tampilkan bantuan

Modul:
  const { scrapeTikTok } = require('./scrape-ttdownloader.js');
  const res = await scrapeTikTok('https://www.tiktok.com/@user/video/123');
`);
}

async function main() {
  const { urls, flags } = parseCliArgs(process.argv.slice(2));

  if (flags.help || urls.length === 0) {
    printHelp();
    process.exit(urls.length === 0 ? 1 : 0);
  }

  const results = [];
  let anyFail = false;

  for (let i = 0; i < urls.length; i++) {
    const input = urls[i];
    try {
      const res = await scrapeTikTok(input, { timeout: flags.timeout });
      results.push(res);
      if (!res.status) anyFail = true;
    } catch (err) {
      anyFail = true;
      results.push({
        status: false,
        error: err.code || 'UNKNOWN',
        message: err.message || String(err),
        url: input,
      });
    }
    // jeda antar URL agar tidak memicu cooldown TikDown
    if (i < urls.length - 1) await sleep(11000);
  }

  const output = results.length === 1 ? results[0] : results;

  // selalu tulis result.json
  const outPath = path.isAbsolute(flags.out) ? flags.out : path.resolve(process.cwd(), flags.out);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  if (!flags.quiet) process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  else process.stderr.write(`Selesai. Hasil ditulis ke: ${outPath}\n`);

  process.exit(anyFail ? 1 : 0);
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`[scrape-ttdownloader] ${err.message}\n`);
    process.exit(1);
  });
}

/* ---------------------------------------------------------------------------
 * Ekspor modul
 * ------------------------------------------------------------------------- */

module.exports = {
  scrapeTikTok,
  TikDownClient,
  ClipsClient,
  normalizeTikTokUrl,
  DEFAULTS,
};
