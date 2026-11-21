#!/usr/bin/env node
"use strict";

/**
 * Name: Omdown All In One Downloader (Fixed)
 * Creator: Razeerh
 * Source: https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps: https://www(.)omdown(.)site
 * Type: Scraper/JSON
 * Description: All In One Downloader.
 * Note: Scrape omdown diperbaiki, jadi harusnya udah bisa dipakai.
 **/

const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

const VERSION = "1.0.0";
const SCHEMA_VERSION = "1.0";
const BASE = "https://www.omdown.site";
const DEFAULT_ACTION_ID = "708399a12b89c0c44316117a83426033874649eaec";
const DEFAULT_LOCALE = "id";
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 2;
const TOKEN_TTL_SECONDS = 900;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const ACCEPT_LANGUAGE = "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7";

// Ordered exactly like the detection list shipped by omdown.site.
const PLATFORMS = [
  { name: "PineDrama", category: "video", domain: "shortdrama.tiktok.com", hostPattern: /(?:^|\.)shortdrama\.tiktok\.com$/i },
  { name: "TikTok", category: "social", domain: "www.tiktok.com", hostPattern: /(?:^|\.)tiktok\.com$/i },
  { name: "Douyin", category: "video", domain: "www.douyin.com", hostPattern: /(?:^|\.)(?:douyin\.com|iesdouyin\.com)$/i },
  { name: "Kuaishou", category: "video", domain: "www.kuaishou.com", hostPattern: /(?:^|\.)(?:kuaishou\.com|kwai\.com)$/i },
  { name: "SnackVideo", category: "video", domain: "www.snackvideo.com", hostPattern: /(?:^|\.)(?:snackvideo\.com|sck\.io)$/i },
  { name: "RedNote", category: "social", domain: "www.xiaohongshu.com", hostPattern: /(?:^|\.)(?:xiaohongshu\.com|rednote\.com|xhslink\.com)$/i },
  { name: "YouTube", category: "video", domain: "www.youtube.com", hostPattern: /(?:^|\.)(?:youtu\.be|youtube\.com)$/i },
  { name: "Instagram", category: "social", domain: "www.instagram.com", hostPattern: /(?:^|\.)(?:instagram\.com|instagr\.am|ig\.me)$/i },
  { name: "X", category: "social", domain: "x.com", hostPattern: /(?:^|\.)(?:twitter\.com|x\.com|t\.co)$/i },
  { name: "Facebook", category: "social", domain: "www.facebook.com", hostPattern: /(?:^|\.)(?:facebook\.com|fb\.watch|fb\.com)$/i },
  { name: "Threads", category: "social", domain: "www.threads.net", hostPattern: /(?:^|\.)threads\.(?:net|com)$/i },
  { name: "Bluesky", category: "social", domain: "bsky.app", hostPattern: /(?:^|\.)(?:bsky\.app|bsky\.social)$/i },
  { name: "Reddit", category: "social", domain: "www.reddit.com", hostPattern: /(?:^|\.)(?:reddit\.com|redd\.it)$/i },
  { name: "CapCut", category: "video", domain: "www.capcut.com", hostPattern: /(?:^|\.)capcut\.com$/i },
  { name: "Snapchat", category: "social", domain: "www.snapchat.com", hostPattern: /(?:^|\.)snapchat\.com$/i },
  { name: "Twitch", category: "video", domain: "www.twitch.tv", hostPattern: /(?:^|\.)twitch\.tv$/i },
  { name: "Bilibili", category: "video", domain: "www.bilibili.com", hostPattern: /(?:^|\.)(?:bilibili\.com|bilibili\.tv|b23\.tv|bili\.im)$/i },
  { name: "Dailymotion", category: "video", domain: "www.dailymotion.com", hostPattern: /(?:^|\.)(?:dailymotion\.com|dai\.ly)$/i },
  { name: "Lahelu", category: "video", domain: "lahelu.com", hostPattern: /(?:^|\.)lahelu\.com$/i },
  { name: "Spotify", category: "audio", domain: "open.spotify.com", hostPattern: /(?:^|\.)(?:spotify\.com|spoti\.fi)$/i },
  { name: "SoundCloud", category: "audio", domain: "soundcloud.com", hostPattern: /(?:^|\.)soundcloud\.com$/i },
  { name: "Apple Music", category: "audio", domain: "music.apple.com", hostPattern: /(?:^|\.)(?:music\.apple\.com|apple\.co)$/i },
  { name: "Pinterest", category: "image", domain: "www.pinterest.com", hostPattern: /(?:^|\.)(?:pinterest\.(?:com|co\.[a-z]{2}|[a-z]{2,3})|pin\.it)$/i },
  { name: "DeviantArt", category: "image", domain: "www.deviantart.com", hostPattern: /(?:^|\.)deviantart\.com$/i },
  { name: "Pixiv", category: "image", domain: "www.pixiv.net", hostPattern: /(?:^|\.)pixiv\.net$/i },
  { name: "MangaDex", category: "image", domain: "mangadex.org", hostPattern: /(?:^|\.)mangadex\.org$/i },
  { name: "Imgur", category: "image", domain: "imgur.com", hostPattern: /(?:^|\.)imgur\.com$/i },
];

const SOCIAL_PLATFORMS = new Set([
  "tiktok", "instagram", "x", "facebook", "threads", "bluesky", "reddit",
  "snapchat", "pinterest", "deviantart", "pixiv", "mangadex", "imgur",
  "douyin", "kuaishou", "snackvideo", "rednote", "lahelu", "pinedrama",
]);

const ARCHIVE_IDS = new Set(["all-playlist", "all-slides"]);

const KNOWN_RAW_KEYS = new Set([
  "platform", "title", "durationLabel", "thumbnailUrl", "previewUrl",
  "previewKind", "embedUrl", "author", "authorAvatar", "rawUrl",
  "isCarousel", "slides", "formats", "profile", "stats", "music",
]);

const KNOWN_FORMAT_KEYS = new Set([
  "id", "label", "description", "kind", "quality", "ext", "hasWatermark",
  "downloadUrl", "slideIndex", "thumbnailUrl", "jobKey", "trackUrl",
]);

const KNOWN_PROFILE_KEYS = new Set([
  "id", "name", "username", "handle", "avatar", "avatarUrl", "bio",
  "description", "followers", "followerCount", "following",
  "followingCount", "verified", "url", "profileUrl",
]);

let GLOBAL_ACTION_ID = null;

class OmdownError extends Error {
  constructor(code, message, options = {}) {
    super(message || code);
    this.name = "OmdownError";
    this.code = code;
    this.status = options.status == null ? null : options.status;
    this.retryable = options.retryable === true;
    this.details = options.details == null ? null : options.details;
    if (options.cause) this.cause = options.cause;
  }
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoff(attempt) {
  return Math.min(5000, 400 * Math.pow(2, attempt)) + Math.floor(Math.random() * 150);
}

function parseRetryAfter(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(8000, Math.max(0, seconds * 1000));
  const date = Date.parse(value);
  if (Number.isFinite(date)) return Math.min(8000, Math.max(0, date - Date.now()));
  return null;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value) {
  if (typeof value === "string") {
    const s = value.trim();
    return s && s !== "$undefined" && s !== "undefined" ? s : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asBool(value) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function asInt(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function unique(values) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    if (value == null || value === "") continue;
    const key = typeof value === "string" ? value.toLowerCase() : JSON.stringify(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function formatCompact(n) {
  if (n == null || !Number.isFinite(n)) return null;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${trimZero(n / 1e9)}B`;
  if (abs >= 1e6) return `${trimZero(n / 1e6)}M`;
  if (abs >= 1e3) return `${trimZero(n / 1e3)}K`;
  return String(Math.round(n));
}

function trimZero(n) {
  return String(Math.round(n * 10) / 10);
}

function parseCount(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  let s = String(value).trim().toLowerCase().replace(/\u00a0/g, " ").replace(/\s+/g, " ");
  if (!s) return null;
  const m = s.match(/(-?\d[\d.,]*)\s*(jt|juta|rb|ribu|k|m|b|mn|bn)?/i);
  if (!m) return null;
  let num = m[1];
  const suffix = (m[2] || "").toLowerCase();
  let multiplier = 1;
  if (suffix === "jt" || suffix === "juta") {
    multiplier = 1e6;
    num = num.replace(/\./g, "").replace(",", ".");
  } else if (suffix === "rb" || suffix === "ribu") {
    multiplier = 1e3;
    num = num.replace(/\./g, "").replace(",", ".");
  } else if (suffix === "k") {
    multiplier = 1e3;
    num = num.replace(/,/g, "");
  } else if (suffix === "m" || suffix === "mn") {
    multiplier = 1e6;
    num = num.replace(/,/g, "");
  } else if (suffix === "b" || suffix === "bn") {
    multiplier = 1e9;
    num = num.replace(/,/g, "");
  } else if (/^\d{1,3}(?:[.,]\d{3})+$/.test(num)) {
    num = num.replace(/[.,]/g, "");
  } else {
    num = num.replace(/,/g, ".");
  }
  const n = Number(num);
  if (!Number.isFinite(n)) return null;
  const result = n * multiplier;
  if (!Number.isFinite(result)) return null;
  return Math.abs(result) >= 1 ? Math.round(result) : Math.round(result * 100) / 100;
}

function parseDuration(label) {
  if (!label) return null;
  const m = /^\s*(\d{1,3}):(\d{2})(?::(\d{2}))?\s*$/.exec(String(label));
  if (!m) return null;
  if (m[3] != null) {
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function parseSize(text) {
  if (!text) return null;
  const m = /(\d+(?:[.,]\d+)?)\s*(B|KB|MB|GB|TB)\b/i.exec(String(text));
  if (!m) return null;
  const value = Number(m[1].replace(",", "."));
  const unit = m[2].toUpperCase();
  const multipliers = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  if (!Number.isFinite(value)) return null;
  return {
    bytes: Math.round(value * multipliers[unit]),
    label: m[0].trim(),
    value,
    unit,
  };
}

function parseBitrate(text) {
  if (!text) return null;
  const m = /(\d{2,4})\s*kbps/i.exec(String(text));
  return m ? Number(m[1]) : null;
}

function parseFps(text) {
  if (!text) return null;
  const m = /(\d+(?:\.\d+)?)\s*fps/i.exec(String(text));
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

const RESOLUTION_MAP = {
  "2160p": [3840, 2160],
  "4k": [3840, 2160],
  "1440p": [2560, 1440],
  "2k": [2560, 1440],
  "1080p": [1920, 1080],
  "720p": [1280, 720],
  "480p": [854, 480],
  "360p": [640, 360],
  "240p": [426, 240],
  "144p": [256, 144],
};

function parseResolution(text) {
  if (!text) return null;
  const s = String(text);
  const wxh = /(\d{2,5})\s*[x×]\s*(\d{2,5})/i.exec(s);
  if (wxh) {
    const width = Number(wxh[1]);
    const height = Number(wxh[2]);
    if (width >= 16 && height >= 16) {
      return { label: `${width}x${height}`, width, height };
    }
  }
  const m = /\b(2160p|4k|1440p|2k|1080p|720p|480p|360p|240p|144p)\b/i.exec(s);
  if (!m) return null;
  const key = m[1].toLowerCase();
  const pair = RESOLUTION_MAP[key];
  if (!pair) return null;
  const label = key === "4k" ? "2160p" : key === "2k" ? "1440p" : key;
  return { label, width: pair[0], height: pair[1] };
}

function mimeFromExt(ext) {
  const map = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    flv: "video/x-flv",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    opus: "audio/opus",
    wav: "audio/wav",
    flac: "audio/flac",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    heic: "image/heic",
    svg: "image/svg+xml",
    zip: "application/zip",
    pdf: "application/pdf",
  };
  return map[String(ext || "").toLowerCase()] || null;
}

function inferExtension(kind, text) {
  const s = String(text || "").toLowerCase();
  if (/\bm4a\b/.test(s)) return "m4a";
  if (/\bwebp\b/.test(s)) return "webp";
  if (/\bpng\b/.test(s)) return "png";
  if (/\bjpe?g\b/.test(s)) return "jpeg";
  if (/\bmp3\b/.test(s)) return "mp3";
  if (/\bmp4\b/.test(s)) return "mp4";
  if (/\bwebm\b/.test(s)) return "webm";
  if (/\bzip\b/.test(s)) return "zip";
  if (kind === "video") return "mp4";
  if (kind === "audio") return "mp3";
  if (kind === "image") return "jpg";
  if (kind === "file") return "zip";
  return "bin";
}

function absUrl(value, base = BASE) {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!s || s === "$undefined" || ARCHIVE_IDS.has(s)) return null;
  if (s.startsWith("//")) return `https:${s}`;
  try {
    const u = new URL(s, base.endsWith("/") ? base : `${base}/`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function isTokenUrl(value) {
  if (!value || typeof value !== "string") return false;
  return value.startsWith("/api/media/stream") || /^https?:\/\/[^/]+\/api\/media\/stream/.test(value);
}

function isArchiveValue(value) {
  return typeof value === "string" && ARCHIVE_IDS.has(value);
}

function stripTrailingPunctuation(value) {
  return String(value).replace(/[.,;:!?)\]}"'”’]+$/g, "");
}

function extractHashtags(text) {
  if (!text) return [];
  const out = [];
  const re = /(?:^|\s)#([\p{L}\p{N}_]+)/gu;
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return unique(out);
}

function extractMentions(text) {
  if (!text) return [];
  const out = [];
  const re = /(?:^|\s)@([A-Za-z0-9._]+)/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return unique(out);
}

function extractUrls(text) {
  if (!text) return [];
  const out = [];
  const re = /https?:\/\/[^\s<>"']+/g;
  let m;
  while ((m = re.exec(text))) out.push(stripTrailingPunctuation(m[0]));
  return unique(out);
}

function titleCase(value) {
  return String(value || "")
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function sanitizeProfile(profile) {
  if (!isPlainObject(profile)) return null;
  const out = {};
  for (const [key, value] of Object.entries(profile)) {
    if (KNOWN_PROFILE_KEYS.has(key)) out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

// ---------------------------------------------------------------------------
// RSC (React Server Components) response parsing
// ---------------------------------------------------------------------------

function parseRscChunks(text) {
  const map = Object.create(null);
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\n") {
      i++;
      continue;
    }
    const m = /^([0-9a-f]+):([A-Za-z])([0-9a-f]*),/.exec(text.slice(i));
    if (!m) {
      const nl = text.indexOf("\n", i);
      if (nl < 0) break;
      i = nl + 1;
      continue;
    }
    const [full, id, tag, lenHex] = m;
    const start = i + full.length;
    if (tag === "T" && lenHex) {
      const len = Number.parseInt(lenHex, 16);
      map[id] = text.slice(start, start + len);
      i = start + len;
    } else {
      const nl = text.indexOf("\n", start);
      const end = nl < 0 ? text.length : nl;
      map[id] = text.slice(start, end);
      i = end;
    }
  }
  return map;
}

function parseBalancedJsonAt(text, idx) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let j = idx; j < text.length; j++) {
    const c = text[j];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(idx, j + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function extractActionJson(text) {
  const re = /\{\s*"success"\s*:/g;
  let m;
  while ((m = re.exec(text))) {
    const parsed = parseBalancedJsonAt(text, m.index);
    if (parsed && Object.prototype.hasOwnProperty.call(parsed, "success")) return parsed;
  }
  return null;
}

function resolveRefs(value, map, seen = new Set()) {
  if (typeof value === "string") {
    if (value === "$undefined") return undefined;
    if (value === "$null") return null;
    if (value === "$true") return true;
    if (value === "$false") return false;
    if (value === "$NaN") return NaN;
    if (value === "$Infinity") return Infinity;
    if (value === "$-Infinity") return -Infinity;
    if (/^\$[0-9a-f]+$/.test(value)) {
      const id = value.slice(1);
      if (seen.has(id)) return undefined;
      const raw = map[id];
      if (raw === undefined) return undefined;
      seen.add(id);
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }
      const out = resolveRefs(parsed, map, seen);
      seen.delete(id);
      return out;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => resolveRefs(item, map, seen));
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = resolveRefs(item, map, seen);
    return out;
  }
  return value;
}

function findActionId(text) {
  if (!text) return null;
  const markers = ['"resolveMediaAction"', "'resolveMediaAction'", "resolveMediaAction"];
  for (const marker of markers) {
    let idx = text.indexOf(marker);
    while (idx !== -1) {
      const before = text.slice(Math.max(0, idx - 1200), idx);
      const re = /createServerReference\)?\(\s*["']([0-9a-f]{32,})["']/g;
      let m;
      let last = null;
      while ((m = re.exec(before))) last = m[1];
      if (last) return last;
      idx = text.indexOf(marker, idx + marker.length);
    }
  }
  return null;
}

function extractScriptSrcs(html, base) {
  const out = [];
  const re = /<script[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const resolved = absUrl(m[1], base);
    if (!resolved) continue;
    try {
      if (new URL(resolved).origin === new URL(base).origin) out.push(resolved);
    } catch {
      /* ignore malformed script URL */
    }
  }
  return unique(out).slice(0, 30);
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      try {
        results[index] = { status: "fulfilled", value: await fn(items[index], index) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }
  const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// Error mapping / network helpers
// ---------------------------------------------------------------------------

function mapActionErrorCode(message) {
  const s = String(message || "").toLowerCase();
  if (/belum didukung/.test(s)) return "UNSUPPORTED_PLATFORM";
  if (/tidak didukung|tidak valid|url tidak valid|belum berupa link|wajib diisi/.test(s)) return "INVALID_URL";
  if (/privat|dibatasi|dihapus|tidak tersedia/.test(s)) return "CONTENT_UNAVAILABLE";
  if (/tidak ditemukan/.test(s)) return "NOT_FOUND";
  if (/batas pengunduhan|terlalu banyak permintaan|rate limit|santai sejenak|tunggu \d+ detik/.test(s)) return "RATE_LIMITED";
  if (/sibuk|memuat ulang/.test(s)) return "SERVER_BUSY";
  if (/timeout|terlalu lama/.test(s)) return "TIMEOUT";
  if (/econnrefused|econnreset|enotfound|etimedout|socket|network|fetch failed|gagal terhubung|koneksi|gangguan/.test(s)) return "NETWORK";
  return "ACTION_FAILED";
}

function actionErrorRetryable(code) {
  return code === "RATE_LIMITED" || code === "SERVER_BUSY" ||
    code === "TIMEOUT" || code === "NETWORK";
}

function parseActionWait(message) {
  const match = /tunggu\s+(\d+(?:[.,]\d+)?)\s*detik/i.exec(String(message || ""));
  if (!match) return 1500;
  const seconds = Number(match[1].replace(",", "."));
  if (!Number.isFinite(seconds)) return 1500;
  return Math.max(500, Math.min(5000, Math.ceil(seconds * 1000) + 250));
}

function isAntiBotText(text) {
  return /akses ditolak|panggilan langsung tidak diizinkan|access denied/i.test(String(text || ""));
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status === 500 ||
    status === 502 || status === 503 || status === 504;
}

function normalizeNetworkError(error, timeout, timedOut) {
  if (error instanceof OmdownError) return error;
  const message = error && error.message ? error.message : String(error);
  const code = (error && (error.code || (error.cause && error.cause.code))) || null;
  if (timedOut || (error && error.name === "AbortError") || code === "ABORT_ERR") {
    return new OmdownError("TIMEOUT", `Request timed out after ${timeout}ms.`, {
      retryable: true,
      details: { timeout_ms: timeout },
    });
  }
  const retryableCodes = new Set([
    "ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN",
    "EPIPE", "UND_ERR_SOCKET", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT",
    "UND_ERR_BODY_TIMEOUT",
  ]);
  if (retryableCodes.has(code) || /fetch failed|network|socket|connection/i.test(message)) {
    return new OmdownError("NETWORK", `Network request failed: ${message}`, {
      retryable: true,
      details: { cause: message, code },
    });
  }
  return new OmdownError("NETWORK", `Request failed: ${message}`, {
    retryable: false,
    details: { cause: message, code },
  });
}

function splitSetCookieHeader(value) {
  if (!value) return [];
  return String(value).split(/,(?=\s*[^;=,\s]+=)/);
}

function filenameFromDisposition(value) {
  if (!value) return null;
  const star = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(value);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^["']|["']$/g, ""));
    } catch {
      return star[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  const normal = /filename\s*=\s*("([^"]+)"|([^;]+))/i.exec(value);
  if (!normal) return null;
  return (normal[2] || normal[3] || "").trim();
}

function parseContentRange(value) {
  const match = /^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i.exec(String(value || "").trim());
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return {
    start,
    end,
    total: match[3] === "*" ? null : Number(match[3]),
    length: end >= start ? end - start + 1 : null,
  };
}

async function readResponseLimited(response, limit) {
  if (!Number.isFinite(limit) || limit <= 0) return Buffer.alloc(0);
  if (!response.body || typeof response.body.getReader !== "function") {
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.subarray(0, Math.min(buffer.length, limit));
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (total < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = limit - total;
      const chunk = value.length > remaining ? value.subarray(0, remaining) : value;
      chunks.push(Buffer.from(chunk));
      total += chunk.length;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore cancel errors */
    }
  }
  return Buffer.concat(chunks, total);
}

// ---------------------------------------------------------------------------
// Session: cookies, action-id discovery, action call, downloads
// ---------------------------------------------------------------------------

class OmdownSession {
  constructor(options = {}) {
    this.base = String(options.base || BASE).replace(/\/+$/, "");
    this.locale = options.locale === "en" ? "en" : DEFAULT_LOCALE;
    this.userAgent = options.userAgent || USER_AGENT;
    this.timeout = Math.max(1000, Math.min(300000, Number(options.timeout) || DEFAULT_TIMEOUT));
    this.retries = Math.max(0, Math.min(5, Number.isFinite(options.retries) ? options.retries : DEFAULT_RETRIES));
    this.actionId = options.actionId || null;
    this.debug = options.debug === true;
    this.cookies = new Map();
    this.initialized = false;
    this.actionIdSource = options.actionId ? "option" : null;
    this.stats = { requests: 0, retries: 0, refreshes: 0 };
  }

  debugLog(...args) {
    if (this.debug) console.error("[omdown:debug]", ...args);
  }

  cookieHeader() {
    return Array.from(this.cookies.entries()).map(([key, value]) => `${key}=${value}`).join("; ");
  }

  cookieInfo() {
    return {
      initialized: this.initialized,
      cookie_count: this.cookies.size,
      cookie_names: Array.from(this.cookies.keys()),
    };
  }

  storeCookies(response) {
    let values = [];
    if (typeof response.headers.getSetCookie === "function") {
      values = response.headers.getSetCookie();
    } else {
      values = splitSetCookieHeader(response.headers.get("set-cookie"));
    }
    for (const raw of values) {
      if (!raw) continue;
      const pair = raw.split(";")[0];
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name) this.cookies.set(name, value);
    }
  }

  buildHeaders(extra = {}) {
    const headers = {
      "user-agent": this.userAgent,
      "accept-language": ACCEPT_LANGUAGE,
      ...extra,
    };
    const cookie = this.cookieHeader();
    if (cookie && !headers.cookie) headers.cookie = cookie;
    return headers;
  }

  async fetchWithRetry(url, init = {}, options = {}) {
    const retries = options.retries == null
      ? this.retries
      : Math.max(0, Math.min(5, Number(options.retries) || 0));
    const timeout = options.timeout == null
      ? this.timeout
      : Math.max(1000, Math.min(300000, Number(options.timeout) || this.timeout));
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeout);
      const external = options.signal;
      const onAbort = () => controller.abort();
      if (external) {
        if (external.aborted) {
          clearTimeout(timer);
          throw new OmdownError("ABORTED", "The operation was aborted.", { retryable: false });
        }
        external.addEventListener("abort", onAbort, { once: true });
      }

      try {
        this.stats.requests++;
        const response = await fetch(url, {
          ...init,
          headers: this.buildHeaders(init.headers),
          signal: controller.signal,
          redirect: init.redirect || "follow",
        });
        this.storeCookies(response);
        this.debugLog(`${init.method || "GET"} ${url} -> ${response.status}`);

        if (isRetryableStatus(response.status) && attempt < retries) {
          lastError = new OmdownError(`HTTP_${response.status}`, `Server returned HTTP ${response.status}.`, {
            status: response.status,
            retryable: true,
          });
          const wait = parseRetryAfter(response.headers.get("retry-after")) ?? backoff(attempt);
          try {
            await response.arrayBuffer();
          } catch {
            /* ignore body drain errors */
          }
          this.stats.retries++;
          await sleep(wait);
          continue;
        }
        return response;
      } catch (error) {
        if (external && external.aborted) {
          const aborted = new OmdownError("ABORTED", "The operation was aborted.", {
            retryable: false,
          });
          lastError = aborted;
          throw aborted;
        }
        const normalized = normalizeNetworkError(error, timeout, timedOut);
        lastError = normalized;
        if (attempt < retries && normalized.retryable) {
          this.stats.retries++;
          await sleep(backoff(attempt));
          continue;
        }
        throw normalized;
      } finally {
        clearTimeout(timer);
        if (external) external.removeEventListener("abort", onAbort);
      }
    }
    throw lastError || new OmdownError("NETWORK", "Request failed.");
  }

  async ensure() {
    if (this.initialized) return this;
    const endpoint = `${this.base}/${this.locale}`;
    const response = await this.fetchWithRetry(endpoint, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "sec-fetch-site": "none",
        "sec-fetch-mode": "navigate",
        "sec-fetch-dest": "document",
        "upgrade-insecure-requests": "1",
      },
    }, { retries: this.retries, timeout: this.timeout });

    if (!response.ok) {
      throw new OmdownError("HOME_FAILED", `Could not open ${endpoint} (HTTP ${response.status}).`, {
        status: response.status,
        retryable: response.status >= 500 || response.status === 429,
      });
    }

    const html = await response.text();
    if (!this.actionId) {
      const discovered = await this.discoverActionId(html);
      if (discovered) {
        this.actionId = discovered.id;
        this.actionIdSource = discovered.source;
        GLOBAL_ACTION_ID = discovered.id;
      }
    }
    if (!this.actionId) {
      this.actionId = DEFAULT_ACTION_ID;
      this.actionIdSource = "fallback";
    }
    this.initialized = true;
    this.debugLog(`session ready; action=${this.actionId} (${this.actionIdSource}); cookies=${this.cookieInfo().cookie_names.join(",") || "none"}`);
    return this;
  }

  async discoverActionId(html) {
    if (GLOBAL_ACTION_ID) return { id: GLOBAL_ACTION_ID, source: "cache" };
    const inHtml = findActionId(html);
    if (inHtml) return { id: inHtml, source: "html" };

    const scripts = extractScriptSrcs(html, this.base);
    if (!scripts.length) return null;
    this.debugLog(`discovering action id across ${scripts.length} scripts`);

    const results = await mapLimit(scripts, 6, async (src) => {
      const response = await this.fetchWithRetry(src, {
        headers: {
          accept: "*/*",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "no-cors",
          "sec-fetch-dest": "script",
        },
      }, { retries: 0, timeout: Math.min(this.timeout, 15000) });
      if (!response.ok) return null;
      return findActionId(await response.text());
    });

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) return { id: result.value, source: "chunk" };
    }
    return null;
  }

  async refresh(options = {}) {
    this.stats.refreshes++;
    this.debugLog(options.rediscover ? "refreshing session and action id" : "refreshing session");
    this.cookies.clear();
    this.initialized = false;
    if (options.rediscover) {
      this.actionId = null;
      this.actionIdSource = null;
      GLOBAL_ACTION_ID = null;
    }
    await this.ensure();
    return this;
  }

  async resolve(url, platformName, locale = this.locale) {
    await this.ensure();
    const endpoint = `${this.base}/${locale}`;
    const body = JSON.stringify([url, platformName, locale]);
    const started = Date.now();
    const maxActionRetries = Math.max(1, Math.min(3, this.retries + 1));
    let refreshed = false;
    let rediscovered = false;
    let actionRetries = 0;
    let rateLimitRetries = 0;
    let response = null;
    let text = "";

    while (true) {
      response = await this.fetchWithRetry(endpoint, {
        method: "POST",
        headers: {
          "content-type": "text/plain;charset=UTF-8",
          "next-action": this.actionId,
          accept: "text/x-component",
          origin: this.base,
          referer: endpoint,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
        },
        body,
      }, { retries: this.retries, timeout: this.timeout });
      text = await response.text();

      const actionJson = extractActionJson(text);
      const antiBot = !actionJson && isAntiBotText(text);
      const denied = response.status === 403 || response.status === 404 || antiBot;
      if (denied && !refreshed) {
        refreshed = true;
        this.debugLog(`action rejected (HTTP ${response.status}); refreshing session and retrying`);
        await this.refresh();
        continue;
      }
      if (denied && !rediscovered) {
        rediscovered = true;
        this.debugLog(`action still rejected (HTTP ${response.status}); rediscovering action id`);
        await this.refresh({ rediscover: true });
        continue;
      }
      if (denied) {
        throw new OmdownError(
          "ACTION_ID_STALE",
          "The site rejected the Server Action request even after rediscovering its ID. " +
          "The action may have rotated, or access may be blocked for this network.",
          {
            status: response.status,
            retryable: false,
            details: {
              action_id: this.actionId,
              action_id_source: this.actionIdSource,
              response_preview: text.slice(0, 300),
            },
          }
        );
      }
      if (!response.ok) {
        throw new OmdownError(`HTTP_${response.status}`, `Server action returned HTTP ${response.status}.`, {
          status: response.status,
          retryable: isRetryableStatus(response.status),
          details: { response_preview: text.slice(0, 300) },
        });
      }

      if (!actionJson) {
        if (isAntiBotText(text)) {
          throw new OmdownError("ACCESS_DENIED", "Access denied by omdown.site anti-bot protection.", {
            status: response.status,
            retryable: false,
            details: { response_preview: text.slice(0, 300) },
          });
        }
        throw new OmdownError("PARSE_ERROR", "Could not find the server action result in the response.", {
          status: response.status,
          retryable: false,
          details: { response_preview: text.slice(0, 300), response_bytes: Buffer.byteLength(text) },
        });
      }

      if (actionJson.success !== true) {
        const message = asString(actionJson.error) || "The server action failed.";
        const code = mapActionErrorCode(message);
        if (actionErrorRetryable(code) && actionRetries < maxActionRetries) {
          actionRetries++;
          if (code === "RATE_LIMITED") rateLimitRetries++;
          const wait = code === "RATE_LIMITED"
            ? parseActionWait(message)
            : backoff(actionRetries - 1);
          this.debugLog(`action error ${code}; retry ${actionRetries}/${maxActionRetries} in ${wait}ms`);
          await sleep(wait);
          continue;
        }
        throw new OmdownError(code, message, {
          status: response.status,
          retryable: actionErrorRetryable(code),
          details: {
            action_success: false,
            original_message: message,
            action_retries: actionRetries,
            rate_limit_retries: rateLimitRetries,
          },
        });
      }

      const chunks = parseRscChunks(text);
      const data = resolveRefs(actionJson.data, chunks);
      if (!data || typeof data !== "object") {
        throw new OmdownError("PARSE_ERROR", "The server action returned no media data.", {
          status: response.status,
          retryable: false,
          details: { chunk_count: Object.keys(chunks).length },
        });
      }

      return {
        data,
        meta: {
          action_id: this.actionId,
          action_id_source: this.actionIdSource,
          locale,
          http_status: response.status,
          response_bytes: Buffer.byteLength(text),
          rsc_chunks: Object.keys(chunks).length,
          elapsed_ms: Date.now() - started,
          action_retries: actionRetries,
          rate_limit_retries: rateLimitRetries,
          session: this.cookieInfo(),
        },
      };
    }
  }

  async download(target, options = {}) {
    await this.ensure();
    let url = null;
    let filename = options.filename || null;

    if (typeof target === "string") {
      url = target;
    } else if (target && typeof target === "object") {
      url = target.download_url || target.downloadUrl || target.url ||
        target.play_url || target.playUrl || null;
      if (!filename) filename = target.filename || null;
    }

    if (!url) {
      throw new OmdownError("INVALID_DOWNLOAD_URL", "No download URL was provided.");
    }
    if (isArchiveValue(url)) {
      throw new OmdownError(
        "ARCHIVE_NOT_DIRECT",
        "Archive placeholders are not direct ZIP URLs. Download the individual items instead.",
        { details: { archive: url } }
      );
    }

    const absolute = absUrl(url, this.base);
    if (!absolute) {
      throw new OmdownError("INVALID_DOWNLOAD_URL", `Invalid download URL: ${url}`);
    }

    const parsed = new URL(absolute);
    if (parsed.pathname === "/api/media/stream") {
      parsed.searchParams.set("download", "1");
      if (filename) parsed.searchParams.set("filename", filename);
    }

    let response = null;
    for (let attempt = 0; attempt <= 1; attempt++) {
      const headers = {
        accept: "*/*",
        referer: `${this.base}/${this.locale}`,
      };
      if (options.range) headers.range = options.range;
      response = await this.fetchWithRetry(parsed.toString(), { headers }, {
        retries: options.retries == null ? this.retries : options.retries,
        timeout: options.timeout == null ? this.timeout : options.timeout,
        signal: options.signal,
      });
      if (response.status === 403 && attempt === 0) {
        this.debugLog("download rejected; refreshing session and retrying");
        await this.refresh();
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      throw new OmdownError("DOWNLOAD_FAILED", `Download failed with HTTP ${response ? response.status : "unknown"}.`, {
        status: response ? response.status : null,
        retryable: response ? isRetryableStatus(response.status) : false,
      });
    }

    const meta = {
      status: response.status,
      content_type: response.headers.get("content-type"),
      content_length: response.headers.get("content-length")
        ? Number(response.headers.get("content-length"))
        : null,
      content_range: response.headers.get("content-range"),
      content_disposition: response.headers.get("content-disposition"),
      server_filename: filenameFromDisposition(response.headers.get("content-disposition")),
      requested_filename: filename,
      url: parsed.toString(),
    };

    const contentRange = parseContentRange(meta.content_range);
    const requestedMatch = /^bytes=(\d+)-(\d+)$/i.exec(String(options.range || "").trim());
    const requestedRangeLength = requestedMatch
      ? Number(requestedMatch[2]) - Number(requestedMatch[1]) + 1
      : null;
    const rangeLimit = options.range
      ? (contentRange && contentRange.length != null ? contentRange.length : requestedRangeLength)
      : null;
    meta.range_requested = options.range || null;
    meta.range_expected_bytes = rangeLimit;
    meta.range_honored = options.range
      ? (rangeLimit != null && rangeLimit > 0)
      : null;
    meta.range_server_honored = options.range && rangeLimit != null && meta.content_length != null
      ? meta.content_length <= rangeLimit
      : null;
    meta.range_note = options.range
      ? "The server may send the full body despite a 206 response; the client reads at most the requested range length."
      : null;

    if (options.out) {
      const outPath = path.resolve(options.out);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      const tmpPath = `${outPath}.part`;
      try {
        if (rangeLimit != null && rangeLimit > 0) {
          const buffer = await readResponseLimited(response, rangeLimit);
          fs.writeFileSync(tmpPath, buffer);
          meta.range_bytes_received = buffer.length;
          meta.range_honored = buffer.length === rangeLimit;
        } else if (response.body && typeof Readable.fromWeb === "function") {
          await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tmpPath));
        } else {
          fs.writeFileSync(tmpPath, Buffer.from(await response.arrayBuffer()));
        }
        fs.renameSync(tmpPath, outPath);
      } catch (error) {
        try {
          if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        } catch {
          /* ignore cleanup failure */
        }
        throw new OmdownError("DOWNLOAD_WRITE_FAILED", `Could not write ${outPath}: ${error.message}`, {
          retryable: false,
          details: { path: outPath, cause: error.message },
        });
      }
      return {
        ok: true,
        ...meta,
        path: outPath,
        bytes: fs.statSync(outPath).size,
      };
    }

    if (rangeLimit != null && rangeLimit > 0) {
      const buffer = await readResponseLimited(response, rangeLimit);
      meta.range_bytes_received = buffer.length;
      meta.range_honored = buffer.length === rangeLimit;
      return {
        ok: true,
        ...meta,
        bytes: buffer.length,
        buffer,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      ok: true,
      ...meta,
      bytes: buffer.length,
      buffer,
    };
  }
}

function createSession(options = {}) {
  return new OmdownSession(options);
}

// ---------------------------------------------------------------------------
// Platform / URL helpers
// ---------------------------------------------------------------------------

function normalizeInputUrl(input) {
  if (typeof input !== "string") return null;
  let s = input.trim();
  if (!s) return null;
  if (s.startsWith("//")) s = `https:${s}`;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function platformKeyOf(name) {
  return String(name || "").toLowerCase().replace(/[\s_-]+/g, "");
}

function detectPlatform(input) {
  const url = normalizeInputUrl(input);
  if (!url) return null;
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const platform of PLATFORMS) {
    if (platform.hostPattern.test(hostname)) {
      return {
        name: platform.name,
        category: platform.category,
        domain: platform.domain,
        key: platformKeyOf(platform.name),
        platform_key: platformKeyOf(platform.name),
        url,
      };
    }
  }
  return null;
}

function platformByName(name) {
  if (!name) return null;
  const key = platformKeyOf(name);
  return PLATFORMS.find((p) => platformKeyOf(p.name) === key) || null;
}

function slugifyTitle(title, max = 30) {
  let s = String(title || "download");
  s = s
    .replace(/^#?\d+[.\s-]+/, "")
    .replace(/\s*\(\d{1,2}:\d{2}\)/, "")
    .replace(/(?:-\s*)?MP3(?:\s*HQ)?|\(MP3.*?\)|^Lagu\s*#\d+:\s*/gi, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
  if (!s) s = "download";
  return s.slice(0, max).replace(/^_+|_+$/g, "") || "download";
}

function buildFilename(platformKey, title, format) {
  const base = `omdown.site_${platformKey}_${slugifyTitle(title, 30)}`;
  const kind = format.kind || "file";
  const ext = format.ext || inferExtension(kind, `${format.label || ""} ${format.quality || ""}`);
  if (kind === "video") {
    const quality = format.resolution && format.resolution.label
      ? slugifyTitle(format.resolution.label, 20).replace(/\s+/g, "_")
      : slugifyTitle(format.quality || "video", 20).replace(/\s+/g, "_");
    return `${base}_${quality}.${ext}`.replace(/_+/g, "_");
  }
  if (kind === "audio") {
    let quality = format.bitrate_kbps ? `${format.bitrate_kbps}kbps` : "audio";
    if (format.is_preview) quality += "_preview";
    if (format.track_title) {
      quality = `${slugifyTitle(format.track_title, 25).replace(/\s+/g, "_")}_${quality}`;
    }
    return `${base}_${quality}.${ext}`.replace(/_+/g, "_");
  }
  if (kind === "image") return `${base}.${ext}`;
  if (kind === "file") {
    const archiveType = format.id === "all-playlist" ? "playlist" : "slides";
    return `${base}_${archiveType}.zip`;
  }
  return `${base}.${ext}`;
}

function parseTrackLabel(label) {
  let s = String(label || "").trim();
  const indexMatch = /^(?:Lagu\s*)?#(\d+)[.:\s-]+/i.exec(s);
  if (!indexMatch) return null;
  const index = Number(indexMatch[1]);
  s = s.slice(indexMatch[0].length).trim();

  let durationLabel = null;
  const durationMatch = /\((\d{1,2}:\d{2})\)\s*(?:-\s*MP3(?:\s*HQ)?)?\s*$/i.exec(s);
  if (durationMatch) {
    durationLabel = durationMatch[1];
    s = s.slice(0, durationMatch.index).trim();
  }
  s = s.replace(/\s*-\s*MP3(?:\s*HQ)?\s*$/i, "").replace(/\(MP3.*?\)/gi, "").trim();

  let title = s || null;
  let artist = null;
  const parts = s.split(/\s+-\s+/);
  if (parts.length >= 2) {
    title = parts[0].trim() || null;
    artist = parts.slice(1).join(" - ").trim() || null;
  }
  return {
    index,
    title,
    artist,
    duration_label: durationLabel,
    duration_seconds: parseDuration(durationLabel),
  };
}

const FB_STAT_RE = /^\s*[\d.,]+\s*(?:jt|rb|k|m|b|juta|ribu)?\s*(?:tayangan|tangggapan|tanggapan|suka|komentar|bagikan|penayangan|views?|likes?|comments?|shares?|reactions?)\b/i;

function splitPipe(value) {
  return String(value || "").split(/\s*\|\s*/).map((part) => part.trim()).filter(Boolean);
}

function cleanFacebookTitle(title) {
  const original = String(title || "").trim();
  if (!original) return null;
  const parts = splitPipe(original);
  while (parts.length && FB_STAT_RE.test(parts[0])) parts.shift();
  const filtered = parts.filter((part) => !/^facebook$/i.test(part));
  let out = filtered.join(" | ").trim();
  if (!out) out = original.replace(/\s*\|\s*Facebook\s*$/i, "").trim();
  return out || original;
}

function parseFacebookStats(text) {
  const s = String(text || "");
  const out = {};
  const patterns = [
    ["views", /([\d.,]+)\s*(jt|rb|k|m|b|juta|ribu)?\s*(?:tayangan|penayangan|views?)\b/i],
    ["comments", /([\d.,]+)\s*(jt|rb|k|m|b|juta|ribu)?\s*(?:tanggapan|komentar|comments?|replies)\b/i],
    ["likes", /([\d.,]+)\s*(jt|rb|k|m|b|juta|ribu)?\s*(?:suka|likes?|reactions?)\b/i],
    ["shares", /([\d.,]+)\s*(jt|rb|k|m|b|juta|ribu)?\s*(?:bagikan|shares?)\b/i],
  ];
  for (const [key, re] of patterns) {
    const match = re.exec(s);
    if (match) out[key] = `${match[1]} ${match[2] || ""}`.trim();
  }
  return out;
}

function cleanFacebookAuthor(author, title) {
  let s = String(author || "").trim();
  let handle = null;
  const handleMatch = /^(.*?)\s*\(@([^)]+)\)\s*$/.exec(s);
  if (handleMatch) {
    s = handleMatch[1].trim();
    handle = handleMatch[2].trim();
  }
  const parts = splitPipe(s);
  while (parts.length && FB_STAT_RE.test(parts[0])) parts.shift();
  let out = parts.join(" | ").trim();
  if (!out || (title && (out === title || out.startsWith(title) || title.startsWith(out)))) {
    out = handle ? titleCase(handle.replace(/[._-]+/g, " ")) : "Facebook";
  }
  return handle ? `${out} (@${handle})` : out;
}

function cleanTitle(raw, platformKey) {
  let s = asString(raw);
  if (!s) return null;
  if (platformKey === "facebook") s = cleanFacebookTitle(s);
  s = s
    .replace(/\u0000/g, "")
    .replace(/\u200b/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s || null;
}

function deriveHandleFromUrl(platformKey, url) {
  try {
    const u = new URL(url);
    const p = decodeURIComponent(u.pathname);
    let m;
    if (platformKey === "tiktok" || platformKey === "douyin") {
      m = /\/@([^/]+)/.exec(p);
      if (m) return m[1];
    }
    if (platformKey === "x") {
      m = /^\/([^/]+)\/status(?:es)?\//.exec(p);
      if (m && !["i", "home", "search", "explore", "hashtag"].includes(m[1].toLowerCase())) return m[1];
    }
    if (platformKey === "instagram") {
      m = /^\/([^/]+)\/(?:p|reel|reels|tv|stories)\//.exec(p);
      if (m && !["p", "reel", "reels", "tv", "stories"].includes(m[1].toLowerCase())) return m[1];
    }
    if (platformKey === "twitch") {
      m = /^\/([^/]+)\/(?:clip|videos?)\//.exec(p);
      if (m) return m[1];
      m = /^\/([^/]+)\/?$/.exec(p);
      if (m && !["directory", "downloads", "settings", "subscriptions", "wallet", "search"].includes(m[1].toLowerCase())) return m[1];
    }
    if (platformKey === "soundcloud") {
      m = /^\/([^/]+)\/[^/]+/.exec(p);
      if (m && !["discover", "stream", "you", "upload", "search"].includes(m[1].toLowerCase())) return m[1];
    }
    if (platformKey === "bluesky") {
      m = /^\/profile\/([^/]+)/.exec(p);
      if (m) return m[1];
    }
    if (platformKey === "youtube") {
      m = /\/@([^/]+)/.exec(p);
      if (m) return m[1];
      m = /\/(?:channel|c|user)\/([^/]+)/.exec(p);
      if (m) return m[1];
    }
    if (platformKey === "facebook") {
      m = /^\/([^/]+)\//.exec(p);
      if (m && !["watch", "video", "videos", "reel", "reels", "stories", "groups", "events", "marketplace", "gaming", "photo", "photos", "permalink.php", "story.php", "share", "sharer"].includes(m[1].toLowerCase())) return m[1];
    }
    if (platformKey === "pinterest") {
      m = /^\/([^/]+)\//.exec(p);
      if (m && !["pin", "explore", "ideas", "search"].includes(m[1].toLowerCase())) return m[1];
    }
    if (platformKey === "reddit") {
      m = /^\/(?:user|u)\/([^/]+)/.exec(p);
      if (m) return m[1];
    }
    if (platformKey === "threads") {
      m = /^\/@([^/]+)/.exec(p);
      if (m) return m[1];
    }
    if (platformKey === "snapchat") {
      m = /^\/@([^/]+)/.exec(p) || /^\/add\/([^/]+)/.exec(p);
      if (m) return m[1];
    }
    if (platformKey === "pixiv") {
      m = /^\/(?:en\/)?users\/(\d+)/.exec(p);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

function profileUrlFor(platformKey, handle) {
  if (!handle) return null;
  const h = String(handle).replace(/^@/, "");
  switch (platformKey) {
    case "youtube":
      return h.startsWith("UC") && h.length >= 20
        ? `https://www.youtube.com/channel/${h}`
        : `https://www.youtube.com/@${h}`;
    case "tiktok": return `https://www.tiktok.com/@${h}`;
    case "instagram": return `https://www.instagram.com/${h}/`;
    case "x": return `https://x.com/${h}`;
    case "bluesky": return `https://bsky.app/profile/${h}`;
    case "twitch": return `https://www.twitch.tv/${h}`;
    case "soundcloud": return `https://soundcloud.com/${h}`;
    case "facebook": return `https://www.facebook.com/${h}`;
    case "threads": return `https://www.threads.net/@${h}`;
    case "snapchat": return `https://www.snapchat.com/@${h}`;
    case "reddit": return `https://www.reddit.com/user/${h}`;
    case "pinterest": return `https://www.pinterest.com/${h}/`;
    case "douyin": return `https://www.douyin.com/user/${h}`;
    case "kuaishou": return `https://www.kuaishou.com/profile/${h}`;
    case "pixiv": return /^\d+$/.test(h) ? `https://www.pixiv.net/users/${h}` : null;
    default: return null;
  }
}

function decodeBlueskyTid(tid) {
  const alphabet = "234567abcdefghijklmnopqrstuvwxyz";
  let n = 0n;
  for (const ch of String(tid).slice(0, 13)) {
    const value = alphabet.indexOf(ch);
    if (value < 0) return null;
    n = (n << 5n) | BigInt(value);
  }
  const micros = n >> 10n;
  return Number(micros / 1000n);
}

function validPublishedDate(ms, source) {
  if (!Number.isFinite(ms)) return null;
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  if (year < 2000 || year > 2100) return null;
  return { iso: date.toISOString(), source, timestamp_ms: ms };
}

function derivePublishedAt(platformKey, url) {
  try {
    if (platformKey === "tiktok" || platformKey === "douyin") {
      const m = /\/(?:video|note)\/(\d{15,25})/.exec(url) || /[?&](?:modal_id|vid)=(\d{15,25})/.exec(url);
      if (m) return validPublishedDate(Number(BigInt(m[1]) >> 32n) * 1000, "tiktok_id");
    }
    if (platformKey === "x") {
      const m = /\/status(?:es)?\/(\d{15,25})/.exec(url);
      if (m) return validPublishedDate(Number((BigInt(m[1]) >> 22n) + 1288834974657n), "x_snowflake");
    }
    if (platformKey === "bluesky") {
      const m = /\/post\/([a-z0-9]{10,20})/i.exec(url);
      if (m) {
        const ms = decodeBlueskyTid(m[1]);
        if (ms != null) return validPublishedDate(ms, "bluesky_tid");
      }
    }
  } catch {
    return null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Format / slide normalization
// ---------------------------------------------------------------------------

function normalizeFormat(raw, ctx) {
  if (!isPlainObject(raw)) return null;
  const id = asString(raw.id) || `format_${ctx.index + 1}`;
  const kind = (asString(raw.kind) || "file").toLowerCase();
  const label = asString(raw.label);
  const description = asString(raw.description);
  const quality = asString(raw.quality);
  const hasWatermark = asBool(raw.hasWatermark);
  const rawDownload = asString(raw.downloadUrl);
  const isArchive = ARCHIVE_IDS.has(id) || isArchiveValue(rawDownload);
  const downloadUrl = isArchive ? null : absUrl(rawDownload, ctx.base);
  const thumbnailUrl = absUrl(asString(raw.thumbnailUrl), ctx.base);
  const trackUrl = absUrl(asString(raw.trackUrl), ctx.base);
  const slideIndex = asInt(raw.slideIndex);
  const ext = (asString(raw.ext) || inferExtension(kind, `${label || ""} ${quality || ""} ${id}`))
    .replace(/^\./, "")
    .toLowerCase();
  const resolution = parseResolution(`${quality || ""} ${label || ""} ${description || ""}`);
  const size = parseSize(description) || parseSize(label);
  const bitrate = parseBitrate(`${quality || ""} ${label || ""} ${description || ""}`);
  const fps = parseFps(`${quality || ""} ${label || ""} ${description || ""}`);
  const isPreview = kind === "audio" &&
    (/_preview\b/i.test(id) || /\bpreview\b/i.test(`${quality || ""} ${label || ""} ${description || ""}`));

  const format = {
    id,
    label,
    description,
    kind,
    quality,
    ext,
    mime_type: mimeFromExt(ext),
    has_watermark: hasWatermark,
    download_url: downloadUrl,
    thumbnail_url: thumbnailUrl,
    track_url: trackUrl,
    slide_index: slideIndex,
    job_key: asString(raw.jobKey),
    is_archive: isArchive,
    archive_type: isArchive ? (id === "all-playlist" ? "playlist" : "slides") : null,
    is_preview: isPreview,
    is_full: kind === "audio" ? !isPreview : null,
    requires_cookie: isTokenUrl(rawDownload),
    url_type: downloadUrl
      ? (isTokenUrl(rawDownload) ? "token" : "external")
      : (isArchive ? "archive-placeholder" : null),
    size_bytes: size ? size.bytes : null,
    size_label: size ? size.label : null,
    bitrate_kbps: bitrate,
    fps,
    resolution,
    width: resolution ? resolution.width : null,
    height: resolution ? resolution.height : null,
    filename: null,
    track_number: null,
    track_title: null,
    track_artist: null,
    duration_label: null,
    duration_seconds: null,
  };

  if (kind === "audio") {
    const track = parseTrackLabel(label || "");
    if (track) {
      format.track_number = track.index;
      format.track_title = track.title;
      format.track_artist = track.artist;
      format.duration_label = track.duration_label;
      format.duration_seconds = track.duration_seconds;
    }
  }

  format.filename = buildFilename(ctx.platformKey, ctx.title, format);
  return format;
}

function normalizeFormats(rawFormats, ctx) {
  const out = [];
  const seen = new Set();
  (Array.isArray(rawFormats) ? rawFormats : []).forEach((raw, index) => {
    const format = normalizeFormat(raw, { ...ctx, index });
    if (!format) return;
    const key = `${format.id}|${format.download_url || format.track_url || ""}|${format.slide_index == null ? "" : format.slide_index}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(format);
  });

  const filenameCounts = new Map();
  for (const format of out) {
    if (!format.filename) continue;
    const count = (filenameCounts.get(format.filename) || 0) + 1;
    filenameCounts.set(format.filename, count);
    if (count > 1) {
      const ext = format.ext ? `.${format.ext}` : "";
      const base = format.filename.endsWith(ext)
        ? format.filename.slice(0, -ext.length)
        : format.filename;
      format.filename = `${base}_${count}${ext}`;
    }
  }
  return out;
}

function normalizeSlide(raw, ctx) {
  if (!isPlainObject(raw)) return null;
  const index = asInt(raw.index);
  const type = (asString(raw.type) || "image").toLowerCase();
  const rawUrl = asString(raw.url) || asString(raw.previewUrl) || asString(raw.thumbnailUrl);
  const url = absUrl(rawUrl, ctx.base);
  const thumbnailUrl = absUrl(asString(raw.thumbnailUrl), ctx.base);
  const previewUrl = absUrl(asString(raw.previewUrl), ctx.base);
  const label = asString(raw.label);
  const ext = type === "video" ? "mp4" : inferExtension("image", label || "");
  const slideIndex = index == null ? ctx.index : index;
  const filename = `omdown.site_${ctx.platformKey}_${String(ctx.index + 1).padStart(2, "0")}_${type === "video" ? "Video" : "Photo"}_Slide_${slideIndex + 1}.${ext}`;
  return {
    index: slideIndex,
    type,
    label,
    url,
    download_url: url,
    thumbnail_url: thumbnailUrl,
    preview_url: previewUrl,
    ext,
    mime_type: mimeFromExt(ext),
    requires_cookie: isTokenUrl(rawUrl),
    is_video: type === "video",
    is_image: type === "image",
    filename,
  };
}

function normalizeSlides(rawSlides, ctx) {
  return (Array.isArray(rawSlides) ? rawSlides : [])
    .map((raw, index) => normalizeSlide(raw, { ...ctx, index }))
    .filter(Boolean);
}

function normalizeImages(formats, slides, thumbnailUrl, authorAvatar, ctx) {
  const byUrl = new Map();

  function add(item) {
    if (!item || !item.url) return;
    const existing = byUrl.get(item.url);
    if (existing) {
      if (!existing.roles.includes(item.role)) existing.roles.push(item.role);
      existing.is_cover = existing.is_cover || item.role === "cover";
      existing.is_thumbnail = existing.is_thumbnail || item.role === "thumbnail";
      existing.is_avatar = existing.is_avatar || item.role === "avatar";
      existing.is_slide = existing.is_slide || item.role === "slide";
      return;
    }
    byUrl.set(item.url, {
      ...item,
      roles: [item.role],
      is_cover: item.role === "cover",
      is_thumbnail: item.role === "thumbnail",
      is_avatar: item.role === "avatar",
      is_slide: item.role === "slide",
    });
  }

  for (const format of formats) {
    if (format.kind !== "image" || format.is_archive) continue;
    let role = "image";
    if (format.slide_index != null) role = "slide";
    else if (/thumb|sampul|thumbnail/i.test(`${format.id} ${format.label || ""}`)) role = "thumbnail";
    else if (/cover|artwork|album|poster/i.test(`${format.id} ${format.label || ""}`)) role = "cover";
    add({
      id: format.id,
      role,
      label: format.label,
      description: format.description,
      url: format.download_url,
      thumbnail_url: format.thumbnail_url,
      preview_url: null,
      ext: format.ext,
      mime_type: format.mime_type,
      quality: format.quality,
      width: format.width,
      height: format.height,
      resolution: format.resolution,
      size_bytes: format.size_bytes,
      size_label: format.size_label,
      requires_cookie: format.requires_cookie,
      source: "format",
      format_id: format.id,
    });
  }

  for (const slide of slides) {
    if (!slide.is_image) continue;
    add({
      id: `slide_${slide.index + 1}`,
      role: "slide",
      label: slide.label,
      description: null,
      url: slide.download_url,
      thumbnail_url: slide.thumbnail_url,
      preview_url: slide.preview_url,
      ext: slide.ext,
      mime_type: slide.mime_type,
      quality: null,
      width: null,
      height: null,
      resolution: null,
      size_bytes: null,
      size_label: null,
      requires_cookie: slide.requires_cookie,
      source: "slide",
      format_id: null,
    });
  }

  const hasThumbnailFormat = formats.some((format) =>
    format.kind === "image" && /thumb|sampul|thumbnail/i.test(`${format.id} ${format.label || ""}`)
  );
  const thumbnail = absUrl(thumbnailUrl, ctx.base);
  if (thumbnail && !hasThumbnailFormat) {
    add({
      id: "thumbnail",
      role: "thumbnail",
      label: "Thumbnail",
      description: null,
      url: thumbnail,
      thumbnail_url: thumbnail,
      preview_url: null,
      ext: null,
      mime_type: null,
      quality: null,
      width: null,
      height: null,
      resolution: null,
      size_bytes: null,
      size_label: null,
      requires_cookie: isTokenUrl(thumbnailUrl),
      source: "response",
      format_id: null,
    });
  }

  const avatar = absUrl(authorAvatar, ctx.base);
  if (avatar) {
    add({
      id: "author_avatar",
      role: "avatar",
      label: "Author avatar",
      description: null,
      url: avatar,
      thumbnail_url: avatar,
      preview_url: null,
      ext: null,
      mime_type: null,
      quality: null,
      width: null,
      height: null,
      resolution: null,
      size_bytes: null,
      size_label: null,
      requires_cookie: isTokenUrl(authorAvatar),
      source: "response",
      format_id: null,
    });
  }

  return Array.from(byUrl.values());
}

// ---------------------------------------------------------------------------
// Media sections
// ---------------------------------------------------------------------------

function videoScore(format) {
  const height = format.height || (format.resolution && format.resolution.height) || 0;
  return height * 1000000 + (format.bitrate_kbps || 0);
}

function pickBestVideo(items) {
  if (!items.length) return null;
  return items.slice().sort((a, b) => videoScore(b) - videoScore(a))[0];
}

function uniqueResolutions(items) {
  const map = new Map();
  for (const item of items) {
    const resolution = item.resolution;
    if (!resolution || !resolution.label) continue;
    if (!map.has(resolution.label)) map.set(resolution.label, resolution);
  }
  return Array.from(map.values());
}

function normalizeVideo(formats, data, ctx) {
  const items = formats.filter((format) => format.kind === "video" && !format.is_archive);
  const primary = pickBestVideo(items);
  const watermarkValues = items.map((item) => item.has_watermark).filter((value) => value !== null);
  return {
    available: items.length > 0,
    count: items.length,
    primary,
    best_format_id: primary ? primary.id : null,
    best_quality: primary ? primary.quality : null,
    best_resolution: primary ? primary.resolution : null,
    qualities: unique(items.map((item) => item.quality).filter(Boolean)),
    resolutions: uniqueResolutions(items),
    has_watermark: watermarkValues.length ? watermarkValues.some(Boolean) : null,
    hls: items.some((item) => /hls|master/i.test(`${item.id} ${item.label || ""} ${item.quality || ""}`)),
    embed_url: absUrl(asString(data.embedUrl), ctx.base),
    items,
  };
}

function normalizeAudio(formats, data, ctx) {
  const items = formats.filter((format) => format.kind === "audio" && !format.is_archive);
  const full = items.filter((item) => item.is_full);
  const preview = items.filter((item) => item.is_preview);
  const primary = full[0] || items[0] || null;
  const sourceDuration = parseDuration(asString(data.durationLabel));
  const likelyPreview = ctx.platformKey === "applemusic" &&
    sourceDuration != null && sourceDuration <= 30 && full.length > 0;
  const notes = [];
  if (likelyPreview) {
    notes.push(
      "Apple Music returned a 30-second track that the source labels as full audio; " +
      "the source likely provides a preview only. Verify the downloaded file before treating it as the complete song."
    );
  }
  const musicRaw = isPlainObject(data.music) ? data.music : null;
  const musicPlayUrl = musicRaw ? absUrl(asString(musicRaw.playUrl), ctx.base) : null;
  const musicDuration = musicRaw ? asInt(musicRaw.duration) : null;
  const music = musicRaw
    ? {
        title: asString(musicRaw.title),
        author: asString(musicRaw.author),
        play_url: musicPlayUrl,
        duration_seconds: musicDuration,
        duration_label: musicDuration == null ? null : formatDuration(musicDuration),
        requires_cookie: isTokenUrl(asString(musicRaw.playUrl)),
        available: !!musicPlayUrl,
      }
    : null;
  return {
    available: items.length > 0,
    count: items.length,
    full_count: full.length,
    preview_count: preview.length,
    has_full_audio: full.length > 0,
    preview_only: items.length > 0 && full.length === 0,
    primary,
    best_format_id: primary ? primary.id : null,
    best_quality: primary ? primary.quality : null,
    bitrates: unique(items.map((item) => item.bitrate_kbps).filter(Boolean)),
    qualities: unique(items.map((item) => item.quality).filter(Boolean)),
    music,
    items,
    notes,
    source_may_be_preview: likelyPreview,
  };
}

function detectPlaylist(ctx, formats) {
  let pathname = "";
  try {
    pathname = new URL(ctx.url).pathname.toLowerCase();
  } catch {
    pathname = "";
  }
  const url = ctx.url.toLowerCase();
  if (/\/playlist\//.test(pathname)) return true;
  if (/\/sets\//.test(pathname)) return true;
  if (/[?&]list=/.test(url)) return true;
  if (/\/album\//.test(pathname) && !/[?&]i=/.test(url)) return true;
  const trackFormats = formats.filter((format) =>
    format.kind === "audio" && /(?:^|_)track_\d+_/.test(format.id)
  );
  return trackFormats.length > 1;
}

function normalizePlaylist(formats, data, ctx, counts) {
  if (!counts.isPlaylist) {
    return {
      is_playlist: false,
      track_count: 0,
      full_track_count: 0,
      preview_track_count: 0,
      tracks: [],
      total_duration_seconds: null,
      total_duration_label: null,
      archive: null,
      archive_label: null,
      expanded: false,
      notes: [],
    };
  }

  const trackFormats = formats.filter((format) => format.kind === "audio" && !format.is_archive);
  const tracks = trackFormats.map((format, index) => {
    const parsed = parseTrackLabel(format.label || "");
    return {
      index: parsed ? parsed.index : index + 1,
      id: format.id,
      title: parsed ? parsed.title : format.track_title,
      artist: parsed ? parsed.artist : format.track_artist,
      duration_label: parsed ? parsed.duration_label : format.duration_label,
      duration_seconds: parsed ? parsed.duration_seconds : format.duration_seconds,
      quality: format.quality,
      bitrate_kbps: format.bitrate_kbps,
      is_preview: format.is_preview,
      is_full: format.is_full,
      ext: format.ext,
      download_url: format.download_url,
      track_url: format.track_url,
      filename: format.filename,
      requires_cookie: format.requires_cookie,
    };
  });

  const archive = formats.find((format) => format.is_archive && format.id === "all-playlist") || null;
  const totalDuration = tracks.length && tracks.every((track) => track.duration_seconds != null)
    ? tracks.reduce((sum, track) => sum + track.duration_seconds, 0)
    : null;
  const notes = [];
  if (tracks.some((track) => track.is_preview)) {
    notes.push("Some tracks are marked as previews by the source; they may be 30-second clips rather than full songs.");
  }
  if (archive) {
    notes.push("The all-playlist entry is a client-side ZIP placeholder, not a direct server ZIP URL.");
  }

  return {
    is_playlist: true,
    track_count: tracks.length,
    full_track_count: tracks.filter((track) => track.is_full).length,
    preview_track_count: tracks.filter((track) => track.is_preview).length,
    tracks,
    total_duration_seconds: totalDuration,
    total_duration_label: totalDuration == null ? null : formatDuration(totalDuration),
    archive,
    archive_label: archive ? archive.label : null,
    expanded: tracks.length > 1,
    notes,
  };
}

function parseArchiveItemCount(text) {
  if (!text) return null;
  const m = /\((\d+)\s*(?:File|Lagu|Track|Item)\)/i.exec(String(text));
  return m ? Number(m[1]) : null;
}

function normalizeCarousel(slides, archives, data, ctx, counts, content) {
  const slideArchive = archives.find((format) => format.id === "all-slides") || null;
  const imageCount = slides.filter((slide) => slide.is_image).length;
  const videoCount = slides.filter((slide) => slide.is_video).length;
  const isCarousel = data.isCarousel === true;
  const expected = slideArchive
    ? parseArchiveItemCount(`${slideArchive.label || ""} ${slideArchive.description || ""}`)
    : null;
  const warnings = [];
  if (isCarousel && slides.length === 0) warnings.push("isCarousel is true but no slides were returned.");
  if (!isCarousel && slides.length > 1) warnings.push("Multiple slides were returned but isCarousel is false.");
  if (expected != null && expected !== slides.length) {
    warnings.push(`Archive label expects ${expected} slides but ${slides.length} were returned.`);
  }
  const mediaCarousel = slides.some((slide) => slide.is_video) ||
    (slides.length > 1 && (content.type === "image" || content.type === "carousel"));
  const decorative = slides.length > 0 && !mediaCarousel &&
    (content.type === "audio" || content.type === "playlist");

  return {
    is_carousel: isCarousel,
    count: slides.length,
    image_count: imageCount,
    video_count: videoCount,
    items: slides,
    archive: slideArchive,
    archive_label: slideArchive ? slideArchive.label : null,
    expected_count: expected,
    count_matches_archive: expected == null ? null : expected === slides.length,
    is_media_carousel: mediaCarousel,
    is_decorative: decorative,
    is_single: slides.length === 1,
    has_video_slide: videoCount > 0,
    has_image_slide: imageCount > 0,
    types: { image: imageCount, video: videoCount },
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Content / author / statistics
// ---------------------------------------------------------------------------

function deriveContentType(counts) {
  if (counts.isPlaylist) return "playlist";
  if (counts.video > 0) return "video";
  if (counts.audio > 0) return "audio";
  if (counts.slides > 1) return "carousel";
  if (counts.image > 0 || counts.slides > 0) return "image";
  return "unknown";
}

function normalizeContent(data, ctx, counts, title, type) {
  const rawTitle = asString(data.title);
  const durationLabel = asString(data.durationLabel);
  const published = derivePublishedAt(ctx.platformKey, ctx.url);
  const hashtags = extractHashtags(title);
  const mentions = extractMentions(title);
  const urls = extractUrls(title);
  const caption = SOCIAL_PLATFORMS.has(ctx.platformKey) ? title : null;

  return {
    title,
    description: asString(data.description),
    caption,
    text: caption,
    type,
    language: asString(data.language),
    duration_label: durationLabel,
    duration_seconds: parseDuration(durationLabel),
    duration_source: durationLabel ? "response.durationLabel" : null,
    is_video: type === "video",
    is_audio: type === "audio",
    is_image: type === "image",
    is_carousel: type === "carousel",
    is_playlist: counts.isPlaylist,
    is_slideshow: counts.slides > 1 && (type === "carousel" || type === "video" || type === "image"),
    is_mixed: [counts.video > 0, counts.audio > 0, counts.image > 0].filter(Boolean).length > 1,
    published_at: published ? published.iso : null,
    published_at_source: published ? published.source : null,
    published_at_timestamp_ms: published ? published.timestamp_ms : null,
    published_at_confidence: published ? "high" : null,
    hashtags,
    mentions,
    urls,
    hashtag_count: hashtags.length,
    mention_count: mentions.length,
    url_count: urls.length,
    title_length: title ? title.length : 0,
    caption_length: caption ? caption.length : 0,
    raw_title: rawTitle && rawTitle !== title ? rawTitle : null,
    title_cleaned: !!(rawTitle && rawTitle !== title),
    facebook_cleaned: ctx.platformKey === "facebook" && rawTitle !== title,
    caption_source: caption ? "title" : null,
    description_source: asString(data.description) ? "response.description" : null,
  };
}

function normalizeAuthor(rawAuthor, data, ctx) {
  const profile = isPlainObject(data.profile) ? data.profile : null;
  let raw = asString(rawAuthor);
  let name = null;
  let handle = null;
  let nameSource = null;

  if (raw && ctx.platformKey === "facebook") {
    raw = cleanFacebookAuthor(raw, ctx.title);
  }

  if (raw) {
    const match = /^(.*?)\s*\(@([^)]+)\)\s*$/.exec(raw);
    if (match) {
      name = asString(match[1]);
      handle = asString(match[2]);
      nameSource = name ? "response" : null;
    } else {
      name = raw;
      nameSource = "response";
    }
  }

  if (profile) {
    const profileName = asString(profile.name) || asString(profile.displayName);
    const profileHandle = asString(profile.username) || asString(profile.handle);
    if (profileName) {
      name = profileName;
      nameSource = "profile";
    }
    if (profileHandle) handle = profileHandle;
  }

  if (!handle) {
    handle = deriveHandleFromUrl(ctx.platformKey, ctx.url);
    if (handle && !name) nameSource = "handle";
  }

  if (ctx.platformKey === "facebook" && handle === "facebook" &&
      (!name || name.length > 40 || (ctx.title && (name.includes(ctx.title) || ctx.title.includes(name))))) {
    name = "Facebook";
    nameSource = "handle";
  }

  if (!name && handle) {
    name = handle;
    nameSource = "handle";
  }

  const rawAvatar = asString(data.authorAvatar) ||
    (profile ? asString(profile.avatar) || asString(profile.avatarUrl) : null);
  const avatar = absUrl(rawAvatar, ctx.base);
  const rawProfileUrl = profile ? asString(profile.url) || asString(profile.profileUrl) : null;
  const profileUrl = absUrl(rawProfileUrl, ctx.base) || profileUrlFor(ctx.platformKey, handle);
  const followers = parseCount(
    profile ? (profile.followers ?? profile.followerCount ?? null) : null
  );
  const following = parseCount(
    profile ? (profile.following ?? profile.followingCount ?? null) : null
  );
  const verified = profile && typeof profile.verified === "boolean" ? profile.verified : null;
  const id = profile ? asString(profile.id) : null;
  const bio = profile ? asString(profile.bio) || asString(profile.description) : null;
  const cleanHandle = handle ? String(handle).replace(/^@/, "") : null;

  return {
    name,
    display_name: name,
    username: cleanHandle,
    handle: cleanHandle ? `@${cleanHandle}` : null,
    id,
    avatar,
    profile_url: profileUrl,
    bio,
    verified,
    followers,
    following,
    followers_label: followers == null ? null : formatCompact(followers),
    following_label: following == null ? null : formatCompact(following),
    name_source: nameSource,
    avatar_requires_cookie: isTokenUrl(rawAvatar),
    raw,
    source: profile ? "profile+response" : "response",
    profile: sanitizeProfile(profile),
  };
}

const STAT_ALIASES = {
  views: ["views", "view", "viewcount", "view_count", "plays", "playcount", "play_count", "penayangan", "tayangan"],
  likes: ["likes", "like", "likecount", "like_count", "suka", "reactions"],
  comments: ["comments", "comment", "commentcount", "comment_count", "komentar", "replies"],
  shares: ["shares", "share", "sharecount", "share_count", "bagikan", "reposts", "retweets"],
  downloads: ["downloads", "download", "downloadcount", "download_count"],
  favorites: ["favorites", "favorite", "favoritecount", "favorite_count", "bookmarks", "saves"],
  followers: ["followers", "followercount", "follower_count"],
  following: ["following", "followingcount", "following_count"],
  subscribers: ["subscribers", "subscribercount", "subscriber_count"],
  score: ["score", "rating"],
  rank: ["rank", "position"],
};

function normalizeStatistics(rawStats, profile, ctx) {
  const source = isPlainObject(rawStats) ? rawStats : {};
  const lower = new Map(Object.entries(source).map(([key, value]) => [key.toLowerCase(), value]));
  const values = {};
  const labels = {};

  for (const [canonical, aliases] of Object.entries(STAT_ALIASES)) {
    let found = false;
    for (const alias of aliases) {
      if (lower.has(alias)) {
        const raw = lower.get(alias);
        const parsed = parseCount(raw);
        values[canonical] = parsed;
        labels[canonical] = raw == null ? null : String(raw);
        found = true;
        break;
      }
    }
    if (!found) {
      values[canonical] = null;
      labels[canonical] = null;
    }
  }

  if (isPlainObject(profile)) {
    if (values.followers == null) {
      values.followers = parseCount(profile.followers ?? profile.followerCount ?? null);
      labels.followers = values.followers == null ? null : String(profile.followers ?? profile.followerCount);
    }
    if (values.following == null) {
      values.following = parseCount(profile.following ?? profile.followingCount ?? null);
      labels.following = values.following == null ? null : String(profile.following ?? profile.followingCount);
    }
  }

  const engagementParts = [values.likes, values.comments, values.shares].filter((value) => value != null);
  const totalEngagements = engagementParts.length
    ? engagementParts.reduce((sum, value) => sum + value, 0)
    : null;
  const engagementRate = totalEngagements != null && values.views != null && values.views > 0
    ? totalEngagements / values.views
    : null;
  const available = Object.values(values).some((value) => value != null);
  const formatted = {};
  for (const [key, value] of Object.entries(values)) {
    formatted[key] = value == null ? null : formatCompact(value);
  }

  return {
    available,
    views: values.views,
    likes: values.likes,
    comments: values.comments,
    shares: values.shares,
    downloads: values.downloads,
    favorites: values.favorites,
    followers: values.followers,
    following: values.following,
    subscribers: values.subscribers,
    score: values.score,
    rank: values.rank,
    total_engagements: totalEngagements,
    engagement_rate: engagementRate == null ? null : Math.round(engagementRate * 1000000) / 1000000,
    engagement_rate_percent: engagementRate == null ? null : Math.round(engagementRate * 1000000) / 10000,
    formatted,
    labels,
    raw: isPlainObject(rawStats) ? rawStats : null,
    source: available ? (isPlainObject(profile) ? "stats+profile" : "stats") : (isPlainObject(profile) ? "profile" : null),
  };
}

// ---------------------------------------------------------------------------
// Media summary / download / thumbnail
// ---------------------------------------------------------------------------

function normalizeMedia(formats, slides, images, video, audio, archives, data, ctx) {
  const downloadableFormats = formats.filter((format) => format.download_url);
  const tokenUrls = new Set();
  const downloadUrls = new Set();

  function collect(url, requiresCookie) {
    if (!url) return;
    downloadUrls.add(url);
    if (requiresCookie || isTokenUrl(url)) tokenUrls.add(url);
  }

  for (const format of formats) {
    collect(format.download_url, format.requires_cookie);
    collect(format.thumbnail_url, isTokenUrl(format.thumbnail_url));
    collect(format.track_url, false);
  }
  for (const slide of slides) {
    collect(slide.download_url, slide.requires_cookie);
    collect(slide.thumbnail_url, isTokenUrl(slide.thumbnail_url));
    collect(slide.preview_url, isTokenUrl(slide.preview_url));
  }
  collect(absUrl(asString(data.thumbnailUrl), ctx.base), isTokenUrl(asString(data.thumbnailUrl)));
  collect(absUrl(asString(data.previewUrl), ctx.base), isTokenUrl(asString(data.previewUrl)));
  collect(absUrl(asString(data.authorAvatar), ctx.base), isTokenUrl(asString(data.authorAvatar)));
  if (isPlainObject(data.music)) {
    collect(absUrl(asString(data.music.playUrl), ctx.base), isTokenUrl(asString(data.music.playUrl)));
  }

  let primary = null;
  let primarySource = null;
  let primaryKind = null;
  if (video.primary) {
    primary = video.primary;
    primarySource = "format";
    primaryKind = "video";
  } else if (audio.primary) {
    primary = audio.primary;
    primarySource = "format";
    primaryKind = "audio";
  } else if (images.length) {
    primary = images.find((image) => image.role === "cover") ||
      images.find((image) => image.role === "thumbnail") ||
      images.find((image) => image.role === "image") ||
      images[0];
    primarySource = "image";
    primaryKind = "image";
  } else if (slides.length) {
    primary = slides[0];
    primarySource = "slide";
    primaryKind = slides[0].type;
  }

  const uniqueMediaUrls = new Set();
  for (const format of formats) if (format.download_url) uniqueMediaUrls.add(format.download_url);
  for (const slide of slides) if (slide.download_url) uniqueMediaUrls.add(slide.download_url);

  return {
    has_video: video.count > 0,
    has_audio: audio.count > 0,
    has_images: images.length > 0,
    has_carousel: slides.length > 0,
    has_playlist: audio.count > 1 || archives.some((archive) => archive.id === "all-playlist"),
    has_archive: archives.length > 0,
    video_count: video.count,
    audio_count: audio.count,
    image_count: images.length,
    slide_count: slides.length,
    archive_count: archives.length,
    total_formats: formats.length,
    downloadable_format_count: downloadableFormats.length,
    downloadable_count: uniqueMediaUrls.size,
    tokenized_url_count: tokenUrls.size,
    download_url_count: downloadUrls.size,
    primary,
    primary_source: primarySource,
    primary_kind: primaryKind,
    primary_format_id: primary ? primary.id || primary.format_id || null : null,
    primary_url: primary ? primary.download_url || primary.url || null : null,
    primary_filename: primary ? primary.filename || null : null,
    extensions: unique([
      ...formats.map((format) => format.ext),
      ...slides.map((slide) => slide.ext),
    ].filter(Boolean)),
    kinds: {
      video: video.count,
      audio: audio.count,
      image: formats.filter((format) => format.kind === "image").length,
      archive: archives.length,
    },
    is_mixed: [video.count > 0, audio.count > 0, images.length > 0].filter(Boolean).length > 1,
    requires_cookie: tokenUrls.size > 0,
    has_embed: !!absUrl(asString(data.embedUrl), ctx.base),
    embed_url: absUrl(asString(data.embedUrl), ctx.base),
    ready: uniqueMediaUrls.size > 0,
  };
}

function downloadEntryFromFormat(format) {
  if (!format || !format.download_url) return null;
  return {
    format_id: format.id || format.format_id || null,
    kind: format.kind || format.type || null,
    label: format.label || null,
    quality: format.quality || null,
    ext: format.ext || null,
    mime_type: format.mime_type || null,
    url: format.download_url,
    filename: format.filename || null,
    requires_cookie: format.requires_cookie === true,
    size_bytes: format.size_bytes == null ? null : format.size_bytes,
    size_label: format.size_label || null,
    resolution: format.resolution || null,
    bitrate_kbps: format.bitrate_kbps == null ? null : format.bitrate_kbps,
    fps: format.fps == null ? null : format.fps,
    slide_index: format.slide_index == null ? null : format.slide_index,
  };
}

function downloadEntryFromSlide(slide) {
  if (!slide || !slide.download_url) return null;
  return {
    format_id: slide.id || null,
    kind: slide.type || null,
    label: slide.label || null,
    quality: null,
    ext: slide.ext || null,
    mime_type: slide.mime_type || null,
    url: slide.download_url,
    filename: slide.filename || null,
    requires_cookie: slide.requires_cookie === true,
    size_bytes: null,
    size_label: null,
    resolution: null,
    bitrate_kbps: null,
    fps: null,
    slide_index: slide.index == null ? null : slide.index,
  };
}

function normalizeDownload(media, formats, archives, slides, thumbnail, ctx) {
  let recommended = null;
  if (media.primary) {
    recommended = media.primary_source === "slide"
      ? downloadEntryFromSlide(media.primary)
      : downloadEntryFromFormat(media.primary);
  }
  if (!recommended && formats.length) {
    recommended = downloadEntryFromFormat(formats.find((format) => format.download_url));
  }
  if (!recommended && slides.length) {
    recommended = downloadEntryFromSlide(slides.find((slide) => slide.download_url));
  }

  const alternatives = formats
    .filter((format) => format.download_url)
    .map(downloadEntryFromFormat)
    .filter(Boolean)
    .filter((entry) => !recommended || entry.url !== recommended.url)
    .slice(0, 8);

  const archiveEntries = archives.map((format) => ({
    id: format.id,
    label: format.label,
    description: format.description,
    kind: format.kind,
    quality: format.quality,
    archive_type: format.archive_type,
    available: false,
    direct_url: null,
    requires_client_zip: true,
    item_count: parseArchiveItemCount(`${format.label || ""} ${format.description || ""}`),
    build_from: format.archive_type === "playlist" ? "audio.items" : "carousel.items",
    note: "The site builds this ZIP in the browser from the individual files; there is no server ZIP URL.",
  }));

  const cookieNames = ctx.meta && ctx.meta.session && Array.isArray(ctx.meta.session.cookie_names)
    ? ctx.meta.session.cookie_names
    : [];

  const instructions = [
    "Use downloadMedia() from this module, or fetch the URL with the same session cookie, Referer, and User-Agent.",
    "Token URLs are bound to the session cookie and expire after about 15 minutes; re-run scrape() for fresh tokens.",
    "Do not share token URLs: they are session-bound and may stop working when the session changes.",
  ];
  if (archiveEntries.length) {
    instructions.push("Archive placeholders are not direct ZIP URLs; download the individual files and build the ZIP yourself.");
  }

  const notes = [];
  if (recommended && recommended.requires_cookie) {
    notes.push("The recommended download requires the om_sec session cookie.");
  }
  if (archiveEntries.length) {
    notes.push("The all-playlist / all-slides entries are client-side ZIP placeholders.");
  }
  notes.push("The server may return HTTP 206 with a Content-Range header but still send the full body; do not rely on range requests to reduce transfer size.");

  return {
    ready: !!recommended,
    method: "GET",
    endpoint: "/api/media/stream",
    download_url: recommended ? recommended.url : null,
    recommended,
    recommended_id: recommended ? recommended.format_id : null,
    recommended_label: recommended ? recommended.label : null,
    recommended_filename: recommended ? recommended.filename : null,
    alternatives,
    archive_entries: archiveEntries,
    archives: archiveEntries,
    requires_cookie: recommended ? recommended.requires_cookie : media.requires_cookie,
    cookie_name: "om_sec",
    cookie_names: cookieNames,
    referer: `${ctx.base}/${ctx.locale}`,
    user_agent: ctx.userAgent,
    required_headers: ["cookie", "referer", "user-agent"],
    token_ttl_seconds: TOKEN_TTL_SECONDS,
    token_ttl_note: "Approximate token lifetime observed for /api/media/stream URLs.",
    range_supported: false,
    server_zip: false,
    archive_strategy: archiveEntries.length ? "client-side ZIP from individual files" : null,
    query_params: recommended
      ? { download: "1", filename: recommended.filename || undefined }
      : { download: "1" },
    instructions,
    notes,
    expires_at: null,
    refresh_instructions: "Call scrape() again to obtain fresh token URLs.",
    thumbnail: thumbnail && thumbnail.url ? downloadEntryFromFormat({
      id: "thumbnail",
      kind: "image",
      label: "Thumbnail",
      ext: thumbnail.ext,
      mime_type: thumbnail.mime_type,
      download_url: thumbnail.url,
      filename: `${slugifyTitle(ctx.title, 30)}_thumbnail.${thumbnail.ext || "jpg"}`,
      requires_cookie: thumbnail.requires_cookie,
      size_bytes: thumbnail.size_bytes,
      size_label: thumbnail.size_label,
      resolution: thumbnail.resolution,
    }) : null,
  };
}

function normalizeThumbnail(rawThumbnail, formats, data, ctx) {
  const raw = asString(rawThumbnail);
  const url = absUrl(raw, ctx.base);
  const imageFormats = formats.filter((format) => format.kind === "image" && !format.is_archive);
  const match = imageFormats.find((format) =>
    /thumb|sampul|thumbnail/i.test(`${format.id} ${format.label || ""}`)
  ) || imageFormats.find((format) =>
    /cover|artwork|album|poster/i.test(`${format.id} ${format.label || ""}`)
  ) || imageFormats[0] || null;
  const previewUrl = absUrl(asString(data.previewUrl), ctx.base);
  return {
    available: !!url,
    url,
    original_url: raw,
    role: "thumbnail",
    ext: match ? match.ext : null,
    mime_type: match ? match.mime_type : null,
    quality: match ? match.quality : null,
    width: match ? match.width : null,
    height: match ? match.height : null,
    resolution: match ? match.resolution : null,
    size_bytes: match ? match.size_bytes : null,
    size_label: match ? match.size_label : null,
    requires_cookie: isTokenUrl(raw),
    tokenized: isTokenUrl(raw),
    source_format_id: match ? match.id : null,
    preview_url: previewUrl,
    preview_kind: asString(data.previewKind),
    notes: [],
  };
}

// ---------------------------------------------------------------------------
// Technical / validation / attribution / extra
// ---------------------------------------------------------------------------

function normalizeTechnical(ctx, data, result) {
  const meta = ctx.meta || {};
  const sessionMeta = meta.session || (ctx.session ? ctx.session.cookieInfo() : {});
  const rawFormats = Array.isArray(data.formats) ? data.formats : [];
  const rawSlides = Array.isArray(data.slides) ? data.slides : [];
  const rawKeys = Object.keys(data);
  const unknownRawKeys = rawKeys.filter((key) => !KNOWN_RAW_KEYS.has(key));
  const unknownFormatFields = unique(
    rawFormats.flatMap((format) => isPlainObject(format) ? Object.keys(format) : [])
      .filter((key) => !KNOWN_FORMAT_KEYS.has(key))
  );
  const sessionStats = ctx.session && ctx.session.stats ? ctx.session.stats : {};

  return {
    schema_version: SCHEMA_VERSION,
    scraper_version: VERSION,
    api: "next-server-action",
    base_url: ctx.base,
    endpoint: `${ctx.base}/${ctx.locale}`,
    action_id: meta.action_id || (ctx.session ? ctx.session.actionId : null),
    action_id_source: meta.action_id_source || (ctx.session ? ctx.session.actionIdSource : null),
    locale: ctx.locale,
    platform_raw: asString(data.platform),
    platform_key: ctx.platformKey,
    platform_category: ctx.platformCategory,
    http_status: meta.http_status == null ? null : meta.http_status,
    response_bytes: meta.response_bytes == null ? null : meta.response_bytes,
    rsc_chunks: meta.rsc_chunks == null ? null : meta.rsc_chunks,
    resolve_time_ms: meta.elapsed_ms == null ? null : meta.elapsed_ms,
    action_retries: meta.action_retries == null ? null : meta.action_retries,
    rate_limit_retries: meta.rate_limit_retries == null ? null : meta.rate_limit_retries,
    total_time_ms: Date.now() - ctx.startedAt.getTime(),
    format_count_raw: rawFormats.length,
    slide_count_raw: rawSlides.length,
    raw_keys: rawKeys,
    unknown_raw_keys: unknownRawKeys,
    unknown_format_fields: unknownFormatFields,
    session: {
      initialized: sessionMeta.initialized == null ? null : sessionMeta.initialized,
      cookie_count: sessionMeta.cookie_count == null ? null : sessionMeta.cookie_count,
      cookie_names: sessionMeta.cookie_names || [],
      requests: sessionStats.requests == null ? null : sessionStats.requests,
      retries: sessionStats.retries == null ? null : sessionStats.retries,
      refreshes: sessionStats.refreshes == null ? null : sessionStats.refreshes,
    },
    timeout_ms: ctx.timeout,
    retries: ctx.retries,
    node_version: process.version,
    user_agent: ctx.userAgent,
    parser: "rsc-chunk-ref-resolver",
    generated_at: new Date().toISOString(),
    raw_response_included: ctx.includeRaw === true,
    has_embed: !!absUrl(asString(data.embedUrl), ctx.base),
    embed_url: absUrl(asString(data.embedUrl), ctx.base),
    tokenized_urls: result.media ? result.media.tokenized_url_count : null,
    format_count: result.formats ? result.formats.length : null,
    media_ready: result.media ? result.media.ready : null,
    download_ready: result.download ? result.download.ready : null,
    profile_present: isPlainObject(data.profile),
    music_present: isPlainObject(data.music),
    stats_present: isPlainObject(data.stats),
    slides_present: rawSlides.length > 0,
    formats_present: rawFormats.length > 0,
    cache: { action_id_cached: !!GLOBAL_ACTION_ID },
  };
}

function isPlaceholderResponse(content, author, statistics) {
  const title = (content.title || "").trim().toLowerCase();
  const authorName = (author.name || "").trim().toLowerCase();
  const views = statistics.views;
  if (title === "youtube video" && authorName === "youtube channel" && (views === 0 || views == null)) {
    return {
      placeholder: true,
      reason: "The server returned generic placeholder metadata (YouTube Video / YouTube Channel / 0 views), which usually means the content is unavailable.",
    };
  }
  const generic = new Set([
    "tiktok video", "instagram post", "facebook post", "x post", "twitter post",
    "video", "media", "unknown",
  ]);
  if (generic.has(title) && (views === 0 || views == null) && authorName && authorName !== "unknown") {
    return {
      placeholder: true,
      reason: `The server returned generic placeholder metadata (${content.title} / ${author.name}).`,
    };
  }
  return { placeholder: false, reason: null };
}

function normalizeValidation(result, data, ctx) {
  const checks = [];
  function check(name, passed, severity, message, details) {
    checks.push({
      name,
      passed: passed === true,
      severity,
      message: passed === true ? null : message,
      details: details == null ? null : details,
    });
  }

  const nonArchiveFormats = (result.formats || []).filter((format) => !format.is_archive);
  const downloadable = [
    ...nonArchiveFormats.filter((format) => format.download_url),
    ...((result.carousel && result.carousel.items) || []).filter((slide) => slide.download_url),
  ];
  const badFormatUrls = nonArchiveFormats.filter((format) =>
    format.download_url && !/^https?:\/\//i.test(format.download_url)
  );
  const badSlideUrls = ((result.carousel && result.carousel.items) || []).filter((slide) =>
    slide.download_url && !/^https?:\/\//i.test(slide.download_url)
  );
  const placeholder = isPlaceholderResponse(result.content, result.author, result.statistics);
  const sections = [
    "content", "author", "statistics", "images", "video", "audio", "playlist",
    "carousel", "formats", "media", "download", "thumbnail", "technical",
    "validation", "attribution", "extra",
  ];
  const missingSections = sections.filter((section) => !(section in result));
  const cookieLeak = JSON.stringify({ ...result, validation: null }).includes("om_sec=");
  const rawStats = isPlainObject(data.stats) ? data.stats : {};
  const rawStatsKeys = Object.keys(rawStats);
  const parsedStats = [
    result.statistics.views, result.statistics.likes, result.statistics.comments,
    result.statistics.shares, result.statistics.downloads, result.statistics.favorites,
    result.statistics.followers, result.statistics.following, result.statistics.subscribers,
  ];

  check("action_success", true, "error", "The server action did not succeed.");
  check("platform_detected", !!result.platform, "error", "The platform could not be detected.");
  check("title_present", !!result.content.title, "warning", "No title or caption was returned.");
  check("author_present", !!result.author.name, "warning", "No author was returned.");
  check("media_present", downloadable.length > 0, "error", "No downloadable media was returned.");
  check("non_archive_formats", nonArchiveFormats.length > 0, "error", "Only archive placeholders were returned.");
  check("format_urls_absolute", badFormatUrls.length === 0, "error", "Some format download URLs are not absolute HTTP(S) URLs.", { count: badFormatUrls.length });
  check("slide_urls_absolute", badSlideUrls.length === 0, "error", "Some slide download URLs are not absolute HTTP(S) URLs.", { count: badSlideUrls.length });
  check("download_ready", !!(result.download && result.download.ready), "error", "No recommended download could be selected.");
  check("placeholder_response", !placeholder.placeholder, "error", placeholder.reason || "The response looks like a placeholder.");
  check("no_cookie_leak", !cookieLeak, "error", "A cookie value appears to be present in the output.");
  check("sections_complete", missingSections.length === 0, "error", "Some schema sections are missing.", { missing: missingSections });

  if (result.content.duration_label) {
    check("duration_parsed", result.content.duration_seconds != null, "warning", "durationLabel could not be parsed.", {
      duration_label: result.content.duration_label,
    });
  }
  if (rawStatsKeys.length) {
    check("stats_parsed", parsedStats.some((value) => value != null), "warning", "Statistics were present but none could be parsed.", {
      raw_keys: rawStatsKeys,
    });
  }
  if (result.content.is_carousel && result.carousel.count === 0) {
    check("carousel_consistency", false, "warning", "isCarousel is true but no slides were returned.");
  } else if (!result.content.is_carousel && result.carousel.count > 1) {
    check("carousel_consistency", false, "warning", "Multiple slides were returned but isCarousel is false.");
  } else {
    check("carousel_consistency", true, "warning", "Carousel flags are consistent.");
  }
  if (result.carousel.count_matches_archive === false) {
    check("archive_count_matches", false, "warning", "The archive label's item count does not match the returned slides.", {
      expected: result.carousel.expected_count,
      actual: result.carousel.count,
    });
  } else {
    check("archive_count_matches", true, "warning", "Archive item counts are consistent.");
  }

  check("token_ttl_documented", true, "info", "Token lifetime is documented as approximately 15 minutes.");
  check("archive_placeholders_documented", true, "info", "Archive placeholders are documented as client-side ZIPs.");
  if (result.audio.preview_only || result.playlist.preview_track_count > 0) {
    check("preview_audio_documented", true, "info", "Preview-only audio is documented in the playlist/audio notes.");
  }
  if (result.author.profile_url) {
    check("author_profile_url", true, "info", "An author profile URL was derived.");
  }

  const errors = checks.filter((item) => !item.passed && item.severity === "error").map((item) => item.message);
  const warnings = checks.filter((item) => !item.passed && item.severity === "warning").map((item) => item.message);
  const notes = checks.filter((item) => !item.passed && item.severity === "info").map((item) => item.message);
  const passed = checks.filter((item) => item.passed).length;

  return {
    valid: errors.length === 0,
    status: errors.length ? "failed" : warnings.length ? "warnings" : "passed",
    score: checks.length ? Math.round((passed / checks.length) * 100) : 0,
    checks,
    errors,
    warnings,
    notes,
    placeholder: placeholder.placeholder,
    placeholder_reason: placeholder.reason,
    media_present: downloadable.length > 0,
    download_ready: !!(result.download && result.download.ready),
    sections_complete: missingSections.length === 0,
    missing_sections: missingSections,
    validator_version: VERSION,
    checked_at: new Date().toISOString(),
    summary: errors.length
      ? `${errors.length} validation error(s), ${warnings.length} warning(s).`
      : warnings.length
        ? `Passed with ${warnings.length} warning(s).`
        : "All validation checks passed.",
  };
}

function normalizeAttribution(data, ctx, content, author) {
  return {
    source: "omdown.site",
    source_name: "Omdown",
    source_url: ctx.base,
    original_url: asString(data.rawUrl) || ctx.url,
    platform: ctx.platformName,
    author: author.name,
    title: content.title,
    scraped_at: ctx.startedAt.toISOString(),
    license: null,
    copyright: null,
    disclaimer: "Metadata is provided by omdown.site. Downloading content may be subject to the original platform's terms and copyright.",
    terms_note: "Only download content you own or have permission to use.",
    via: "Next.js Server Action (resolveMediaAction)",
    api: `${ctx.base}/${ctx.locale}`,
    respect_content_rights: true,
    no_cookie_exported: true,
    token_urls_are_session_bound: true,
    metadata_only: false,
  };
}

function normalizeExtra(data, ctx, archives, audio, playlist, carousel, content, rawFormats, rawSlides) {
  const archiveItems = archives.map((format) => ({
    id: format.id,
    label: format.label,
    description: format.description,
    kind: format.kind,
    quality: format.quality,
    archive_type: format.archive_type,
    available: false,
    direct_url: null,
    requires_client_zip: true,
    item_count: parseArchiveItemCount(`${format.label || ""} ${format.description || ""}`),
    build_from: format.archive_type === "playlist" ? "audio.items" : "carousel.items",
    note: "The site builds this ZIP in the browser from the individual files; there is no server ZIP URL.",
  }));

  const notes = [];
  if (archiveItems.length) {
    notes.push("Archive placeholders (all-playlist / all-slides) are client-side ZIPs, not direct server ZIP URLs.");
  }
  if (audio.preview_only || playlist.preview_track_count > 0) {
    notes.push("Some audio tracks are previews; they may be shorter than the full song.");
  }
  if (audio.music && audio.music.available) {
    notes.push("A separate music/sound track was returned by the source.");
  }
  if (content.title_cleaned) {
    notes.push("The title was normalized (whitespace or source text cleaned); the original is available as content.raw_title.");
  }
  if (content.facebook_cleaned) {
    notes.push("Facebook view/reaction text was removed from the title/author fields.");
  }
  if (playlist.is_playlist && !playlist.expanded) {
    notes.push("The URL is a playlist, but the server returned only one playable item.");
  }
  if (carousel.warnings && carousel.warnings.length) {
    notes.push(...carousel.warnings);
  }
  if (content.type === "unknown") {
    notes.push("The response did not contain enough information to determine the media type.");
  }
  if (data.isCarousel === true && content.type === "audio") {
    notes.push("The carousel contains cover art for an audio item; it is decorative, not a media gallery.");
  }

  const unknownFormatFields = unique(
    (Array.isArray(rawFormats) ? rawFormats : [])
      .flatMap((format) => isPlainObject(format) ? Object.keys(format) : [])
      .filter((key) => !KNOWN_FORMAT_KEYS.has(key))
  );

  const previewUrl = absUrl(asString(data.previewUrl), ctx.base);
  const facebookTitleStats = ctx.platformKey === "facebook"
    ? parseFacebookStats(asString(data.title))
    : {};
  if (Object.keys(facebookTitleStats).length) {
    notes.push("Facebook view/reaction counts were parsed from the response title and added to statistics.");
  }
  return {
    archives: archiveItems,
    archive_count: archiveItems.length,
    music: audio.music,
    profile: sanitizeProfile(data.profile),
    embed_url: absUrl(asString(data.embedUrl), ctx.base),
    has_embed: !!absUrl(asString(data.embedUrl), ctx.base),
    preview: {
      url: previewUrl,
      kind: asString(data.previewKind),
      available: !!previewUrl,
      requires_cookie: isTokenUrl(asString(data.previewUrl)),
    },
    raw_stats: isPlainObject(data.stats) ? data.stats : null,
    facebook_title_stats: facebookTitleStats,
    raw_keys: Object.keys(data),
    unknown_raw_keys: Object.keys(data).filter((key) => !KNOWN_RAW_KEYS.has(key)),
    unknown_format_fields: unknownFormatFields,
    cleaned_fields: {
      title: content.title_cleaned === true,
      author: ctx.platformKey === "facebook" && !!content.title_cleaned,
    },
    published_at_source: content.published_at_source,
    playlist_expanded: playlist.is_playlist ? playlist.expanded : null,
    tokenized_url_count: null,
    format_count_raw: Array.isArray(rawFormats) ? rawFormats.length : 0,
    slide_count_raw: Array.isArray(rawSlides) ? rawSlides.length : 0,
    response_platform: asString(data.platform),
    requested_locale: ctx.locale,
    source_base: ctx.base,
    notes,
    warnings: carousel.warnings || [],
    raw_response_included: ctx.includeRaw === true,
    raw: ctx.includeRaw === true ? data : undefined,
  };
}

// ---------------------------------------------------------------------------
// Main normalizer
// ---------------------------------------------------------------------------

function normalizeMediaData(data, ctx) {
  const rawFormats = Array.isArray(data.formats) ? data.formats : [];
  const rawSlides = Array.isArray(data.slides) ? data.slides : [];
  const title = cleanTitle(data.title, ctx.platformKey);
  const author = normalizeAuthor(data.author, data, { ...ctx, title });
  const formats = normalizeFormats(rawFormats, { ...ctx, title, author });
  const slides = normalizeSlides(rawSlides, { ...ctx, title, author });
  const archives = formats.filter((format) => format.is_archive);
  const mediaFormats = formats.filter((format) => !format.is_archive);

  const counts = {
    video: mediaFormats.filter((format) => format.kind === "video").length,
    audio: mediaFormats.filter((format) => format.kind === "audio").length,
    image: mediaFormats.filter((format) => format.kind === "image").length +
      slides.filter((slide) => slide.is_image).length,
    slides: slides.length,
    archives: archives.length,
    isPlaylist: false,
  };
  counts.isPlaylist = detectPlaylist(ctx, mediaFormats);
  const contentType = deriveContentType(counts);

  const content = normalizeContent(data, ctx, counts, title, contentType);
  let statsSource = data.stats;
  let facebookTitleStats = null;
  if (ctx.platformKey === "facebook") {
    facebookTitleStats = parseFacebookStats(asString(data.title));
    if (Object.keys(facebookTitleStats).length) {
      const merged = isPlainObject(data.stats) ? { ...data.stats } : {};
      for (const [key, value] of Object.entries(facebookTitleStats)) {
        if (merged[key] == null) merged[key] = value;
      }
      statsSource = merged;
    }
  }
  const statistics = normalizeStatistics(statsSource, data.profile, ctx);
  if (facebookTitleStats && Object.keys(facebookTitleStats).length) {
    statistics.source = statistics.source ? `${statistics.source}+title` : "title";
  }
  const images = normalizeImages(mediaFormats, slides, data.thumbnailUrl, data.authorAvatar, ctx);
  const video = normalizeVideo(mediaFormats, data, ctx);
  const audio = normalizeAudio(mediaFormats, data, ctx);
  const playlist = normalizePlaylist(mediaFormats, data, ctx, counts);
  const carousel = normalizeCarousel(slides, archives, data, ctx, counts, content);
  const media = normalizeMedia(mediaFormats, slides, images, video, audio, archives, data, ctx);
  const thumbnail = normalizeThumbnail(data.thumbnailUrl, mediaFormats, data, ctx);
  const download = normalizeDownload(media, mediaFormats, archives, slides, thumbnail, ctx);
  const extra = normalizeExtra(data, ctx, archives, audio, playlist, carousel, content, rawFormats, rawSlides);
  extra.tokenized_url_count = media.tokenized_url_count;
  const attribution = normalizeAttribution(data, ctx, content, author);

  const result = {
    status: "success",
    platform: ctx.platformKey,
    platform_name: ctx.platformName,
    platform_category: ctx.platformCategory,
    url: ctx.url,
    source_url: asString(data.rawUrl) || ctx.url,
    scraped_at: ctx.startedAt.toISOString(),
    duration_ms: null,
    available_formats: mediaFormats.map((format) => format.id),
    available_qualities: unique(mediaFormats.map((format) => format.quality).filter(Boolean)),
    available_resolutions: uniqueResolutions(mediaFormats),
    error: null,
    content,
    author,
    statistics,
    images,
    video,
    audio,
    playlist,
    carousel,
    formats,
    media,
    download,
    thumbnail,
    technical: null,
    validation: null,
    attribution,
    extra,
  };

  result.technical = normalizeTechnical(ctx, data, result);
  result.validation = normalizeValidation(result, data, ctx);

  if (!result.validation.valid) {
    result.status = "partial";
    result.error = {
      code: result.validation.placeholder ? "PLACEHOLDER_CONTENT" : "INVALID_CONTENT",
      message: result.validation.errors[0] || "The response did not pass validation.",
      details: {
        errors: result.validation.errors,
        warnings: result.validation.warnings,
        placeholder: result.validation.placeholder,
        placeholder_reason: result.validation.placeholder_reason,
      },
      retryable: false,
    };
  }

  result.duration_ms = Date.now() - ctx.startedAt.getTime();
  result.technical.total_time_ms = result.duration_ms;

  Object.defineProperty(result, "session", { value: ctx.session, enumerable: false });
  Object.defineProperty(result, "raw", { value: data, enumerable: false });
  return result;
}

function emptySections() {
  return {
    content: {
      title: null, description: null, caption: null, text: null, type: "unknown",
      language: null, duration_label: null, duration_seconds: null, duration_source: null,
      is_video: false, is_audio: false, is_image: false, is_carousel: false,
      is_playlist: false, is_slideshow: false, is_mixed: false,
      published_at: null, published_at_source: null, published_at_timestamp_ms: null,
      published_at_confidence: null, hashtags: [], mentions: [], urls: [],
      hashtag_count: 0, mention_count: 0, url_count: 0, title_length: 0,
      caption_length: 0, raw_title: null, title_cleaned: false,
      facebook_cleaned: false, caption_source: null, description_source: null,
    },
    author: {
      name: null, display_name: null, username: null, handle: null, id: null,
      avatar: null, profile_url: null, bio: null, verified: null,
      followers: null, following: null, followers_label: null, following_label: null,
      name_source: null, avatar_requires_cookie: false, raw: null, source: null,
      profile: null,
    },
    statistics: {
      available: false, views: null, likes: null, comments: null, shares: null,
      downloads: null, favorites: null, followers: null, following: null,
      subscribers: null, score: null, rank: null, total_engagements: null,
      engagement_rate: null, engagement_rate_percent: null, formatted: {},
      labels: {}, raw: null, source: null,
    },
    images: [],
    video: {
      available: false, count: 0, primary: null, best_format_id: null,
      best_quality: null, best_resolution: null, qualities: [], resolutions: [],
      has_watermark: null, hls: false, embed_url: null, items: [],
    },
    audio: {
      available: false, count: 0, full_count: 0, preview_count: 0,
      has_full_audio: false, preview_only: false, primary: null,
      best_format_id: null, best_quality: null, bitrates: [], qualities: [],
      music: null, items: [], notes: [], source_may_be_preview: false,
    },
    playlist: {
      is_playlist: false, track_count: 0, full_track_count: 0,
      preview_track_count: 0, tracks: [], total_duration_seconds: null,
      total_duration_label: null, archive: null, archive_label: null,
      expanded: false, notes: [],
    },
    carousel: {
      is_carousel: false, count: 0, image_count: 0, video_count: 0,
      items: [], archive: null, archive_label: null, expected_count: null,
      count_matches_archive: null, is_media_carousel: false, is_decorative: false,
      is_single: false, has_video_slide: false, has_image_slide: false,
      types: { image: 0, video: 0 }, warnings: [],
    },
    formats: [],
    media: {
      has_video: false, has_audio: false, has_images: false, has_carousel: false,
      has_playlist: false, has_archive: false, video_count: 0, audio_count: 0,
      image_count: 0, slide_count: 0, archive_count: 0, total_formats: 0,
      downloadable_format_count: 0, downloadable_count: 0, tokenized_url_count: 0,
      download_url_count: 0, primary: null, primary_source: null, primary_kind: null,
      primary_format_id: null, primary_url: null, primary_filename: null,
      extensions: [], kinds: { video: 0, audio: 0, image: 0, archive: 0 },
      is_mixed: false, requires_cookie: false, has_embed: false, embed_url: null,
      ready: false,
    },
    download: {
      ready: false, method: "GET", endpoint: "/api/media/stream", download_url: null,
      recommended: null, recommended_id: null, recommended_label: null,
      recommended_filename: null, alternatives: [], archive_entries: [], archives: [],
      requires_cookie: false, cookie_name: "om_sec", cookie_names: [], referer: null,
      user_agent: null, required_headers: ["cookie", "referer", "user-agent"],
      token_ttl_seconds: TOKEN_TTL_SECONDS,
      token_ttl_note: "Approximate token lifetime observed for /api/media/stream URLs.",
      range_supported: false, server_zip: false, archive_strategy: null,
      query_params: { download: "1" }, instructions: [], notes: [], expires_at: null,
      refresh_instructions: "Call scrape() again to obtain fresh token URLs.",
      thumbnail: null,
    },
    thumbnail: {
      available: false, url: null, original_url: null, role: "thumbnail",
      ext: null, mime_type: null, quality: null, width: null, height: null,
      resolution: null, size_bytes: null, size_label: null, requires_cookie: false,
      tokenized: false, source_format_id: null, preview_url: null,
      preview_kind: null, notes: [],
    },
    technical: {},
    validation: {},
    attribution: {},
    extra: {
      archives: [], archive_count: 0, music: null, profile: null, embed_url: null,
      has_embed: false, preview: null, raw_stats: null, facebook_title_stats: {}, raw_keys: [],
      unknown_raw_keys: [], unknown_format_fields: [], cleaned_fields: { title: false, author: false },
      published_at_source: null, playlist_expanded: null, tokenized_url_count: null,
      format_count_raw: 0, slide_count_raw: 0, response_platform: null,
      requested_locale: null, source_base: BASE, notes: [], warnings: [],
      raw_response_included: false,
    },
  };
}

function buildErrorResult(url, error, options = {}) {
  const startedAt = options.startedAt instanceof Date ? options.startedAt : null;
  const durationMs = options.durationMs == null
    ? (startedAt ? Date.now() - startedAt.getTime() : null)
    : options.durationMs;
  const locale = options.locale === "en" ? "en" : "id";
  const err = error instanceof OmdownError
    ? error
    : new OmdownError("UNKNOWN", error && error.message ? error.message : String(error), {
        retryable: false,
        details: { cause: error && error.message ? error.message : String(error) },
      });
  const detected = detectPlatform(url);
  const platformName = options.platform || (detected ? detected.name : null);
  const platformKey = platformName ? platformKeyOf(platformName) : null;
  const platformCategory = detected
    ? detected.category
    : (platformByName(platformName) ? platformByName(platformName).category : null);
  const empty = emptySections();
  const result = {
    status: "error",
    platform: platformKey,
    platform_name: platformName,
    platform_category: platformCategory,
    url: normalizeInputUrl(url) || (typeof url === "string" ? url : null),
    source_url: null,
    scraped_at: (startedAt || new Date()).toISOString(),
    duration_ms: durationMs,
    available_formats: [],
    available_qualities: [],
    available_resolutions: [],
    error: err.toJSON(),
    ...empty,
  };

  result.technical = {
    schema_version: SCHEMA_VERSION,
    scraper_version: VERSION,
    api: "next-server-action",
    base_url: options.base || BASE,
    endpoint: `${options.base || BASE}/${locale}`,
    action_id: options.actionId || null,
    action_id_source: null,
    locale,
    platform_raw: null,
    platform_key: platformKey,
    platform_category: platformCategory,
    http_status: err.status,
    response_bytes: null,
    rsc_chunks: null,
    resolve_time_ms: null,
    total_time_ms: durationMs,
    format_count_raw: 0,
    slide_count_raw: 0,
    raw_keys: [],
    unknown_raw_keys: [],
    unknown_format_fields: [],
    session: null,
    timeout_ms: options.timeout == null ? DEFAULT_TIMEOUT : options.timeout,
    retries: options.retries == null ? DEFAULT_RETRIES : options.retries,
    node_version: process.version,
    user_agent: options.userAgent || USER_AGENT,
    parser: "rsc-chunk-ref-resolver",
    generated_at: new Date().toISOString(),
    raw_response_included: options.includeRaw === true,
    error_code: err.code,
    error_message: err.message,
  };

  result.validation = {
    valid: false,
    status: "failed",
    score: 0,
    checks: [{
      name: "scrape",
      passed: false,
      severity: "error",
      message: err.message,
      details: err.details,
    }],
    errors: [err.message],
    warnings: [],
    notes: [],
    placeholder: false,
    placeholder_reason: null,
    media_present: false,
    download_ready: false,
    sections_complete: true,
    missing_sections: [],
    validator_version: VERSION,
    checked_at: new Date().toISOString(),
    summary: err.message,
  };

  result.attribution = {
    source: "omdown.site",
    source_name: "Omdown",
    source_url: BASE,
    original_url: normalizeInputUrl(url) || (typeof url === "string" ? url : null),
    platform: platformName,
    author: null,
    title: null,
    scraped_at: (startedAt || new Date()).toISOString(),
    license: null,
    copyright: null,
    disclaimer: "Metadata is provided by omdown.site. Downloading content may be subject to the original platform's terms and copyright.",
    terms_note: "Only download content you own or have permission to use.",
    via: "Next.js Server Action (resolveMediaAction)",
    api: `${BASE}/${locale}`,
    respect_content_rights: true,
    no_cookie_exported: true,
    token_urls_are_session_bound: true,
    metadata_only: false,
  };

  result.extra = {
    ...result.extra,
    notes: [err.message],
    error_code: err.code,
    retryable: err.retryable,
    requested_locale: locale,
    raw_response_included: options.includeRaw === true,
  };

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function createContext(baseOptions = {}) {
  return {
    base: String(baseOptions.base || BASE).replace(/\/+$/, ""),
    locale: baseOptions.locale === "en" ? "en" : "id",
    timeout: Math.max(1000, Math.min(300000, Number(baseOptions.timeout) || DEFAULT_TIMEOUT)),
    retries: Math.max(0, Math.min(5, Number.isFinite(baseOptions.retries) ? baseOptions.retries : DEFAULT_RETRIES)),
    userAgent: baseOptions.userAgent || USER_AGENT,
    debug: baseOptions.debug === true,
    actionId: baseOptions.actionId || null,
    includeRaw: baseOptions.raw === true || baseOptions.includeRaw === true,
  };
}

async function scrapeRaw(url, options = {}) {
  const normalizedUrl = normalizeInputUrl(url);
  if (!normalizedUrl) {
    throw new OmdownError("INVALID_URL", "The provided URL is not a valid HTTP(S) URL.", {
      retryable: false,
      details: { input: typeof url === "string" ? url : null },
    });
  }

  const detected = detectPlatform(normalizedUrl);
  const requestedPlatform = options.platform ? String(options.platform) : null;
  const knownRequested = requestedPlatform ? platformByName(requestedPlatform) : null;
  const platformName = knownRequested ? knownRequested.name : requestedPlatform || (detected ? detected.name : null);
  if (!platformName) {
    throw new OmdownError(
      "UNSUPPORTED_PLATFORM",
      "This URL does not match any supported platform. Use listPlatforms() to see supported platforms.",
      { retryable: false, details: { url: normalizedUrl } }
    );
  }

  const context = createContext({ ...options, url: normalizedUrl });
  const session = options.session instanceof OmdownSession
    ? options.session
    : createSession({
        base: context.base,
        locale: context.locale,
        timeout: context.timeout,
        retries: context.retries,
        userAgent: context.userAgent,
        actionId: context.actionId,
        debug: context.debug,
      });

  const resolved = await session.resolve(normalizedUrl, platformName, context.locale);
  const platform = knownRequested || platformByName(platformName) || null;
  const out = {
    status: "success",
    platform: platformKeyOf(platformName),
    platform_name: platformName,
    platform_category: platform ? platform.category : (detected ? detected.category : "unknown"),
    url: normalizedUrl,
    data: resolved.data,
    meta: resolved.meta,
  };
  Object.defineProperty(out, "session", { value: session, enumerable: false });
  return out;
}

async function scrape(url, options = {}) {
  const startedAt = new Date();
  const raw = await scrapeRaw(url, options);
  const context = createContext({ ...options, url: raw.url });
  const ctx = {
    ...context,
    startedAt,
    session: raw.session,
    meta: raw.meta,
    platformKey: raw.platform,
    platformName: raw.platform_name,
    platformCategory: raw.platform_category,
    url: raw.url,
  };
  return normalizeMediaData(raw.data, ctx);
}

async function downloadMedia(target, options = {}) {
  let actualTarget = target;
  let session = options.session || (target && target.session) || null;

  const isScrapeResult = target && typeof target === "object" &&
    target.download && target.download.recommended &&
    target.content && Array.isArray(target.formats);
  if (isScrapeResult) {
    actualTarget = target.download.recommended;
    session = session || target.session;
  } else if (target && typeof target === "object" && target.content && target.download) {
    throw new OmdownError(
      "NO_RECOMMENDED_DOWNLOAD",
      "This scrape result has no recommended download. Pass a format, thumbnail, or token URL instead.",
      { retryable: false }
    );
  }

  const targetUrl = typeof actualTarget === "string"
    ? actualTarget
    : (actualTarget && (actualTarget.url || actualTarget.download_url || actualTarget.downloadUrl)) || null;
  const requiresCookie = isTokenUrl(targetUrl) ||
    (actualTarget && typeof actualTarget === "object" && actualTarget.requires_cookie === true);
  const hadSession = !!session;

  if (!session) {
    session = createSession({
      base: options.base,
      locale: options.locale,
      timeout: options.timeout,
      retries: options.retries,
      userAgent: options.userAgent,
      actionId: options.actionId,
      debug: options.debug,
    });
  }

  try {
    return await session.download(actualTarget, options);
  } catch (error) {
    if (!hadSession && requiresCookie && error instanceof OmdownError &&
        (error.status === 403 || error.code === "DOWNLOAD_FAILED")) {
      throw new OmdownError(
        "SESSION_REQUIRED",
        "This token URL is bound to the session that created it. Pass the in-memory scrape result " +
        "(which carries a hidden session) or a session option instead of a plain JSON object.",
        { retryable: false, details: { url: targetUrl, cause: error.message } }
      );
    }
    throw error;
  }
}

function listPlatforms() {
  return PLATFORMS.map((platform) => ({
    name: platform.name,
    key: platformKeyOf(platform.name),
    category: platform.category,
    domain: platform.domain,
  }));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const HELP_TEXT = `scrape-omdown.js ${VERSION}
Zero-dependency scraper for https://www.omdown.site

Usage:
  node scrape-omdown.js <url> [options]
  node scrape-omdown.js --list

Options:
  -p, --platform <name>   Override platform detection (e.g. YouTube, TikTok)
  -l, --locale <id|en>    Site locale (default: id)
  -o, --out <file>        Output JSON file (default: result.json)
      --raw               Include the raw Server Action data in extra.raw
      --timeout <ms>      Per-request timeout (default: ${DEFAULT_TIMEOUT})
      --retries <n>       Retry count (default: ${DEFAULT_RETRIES})
      --action-id <id>    Override the Next.js Server Action ID
      --download <id>     After scraping, download: best, thumbnail, or a format id
      --download-out <f>  Output path for --download
      --list              List supported platforms
  -q, --quiet             Suppress progress messages
      --debug             Print debug messages to stderr
  -h, --help              Show this help
  -v, --version           Show version

Examples:
  node scrape-omdown.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  node scrape-omdown.js "https://www.tiktok.com/@user/video/123" --out tiktok.json
  node scrape-omdown.js "https://x.com/NASA/status/123" --download best --download-out clip.mp4
  node scrape-omdown.js --list
`;

function parseArgs(argv) {
  const args = {
    url: null,
    platform: null,
    locale: "id",
    out: "result.json",
    raw: false,
    timeout: DEFAULT_TIMEOUT,
    retries: DEFAULT_RETRIES,
    actionId: null,
    download: null,
    downloadOut: null,
    list: false,
    quiet: false,
    debug: false,
    help: false,
    version: false,
    errors: [],
    extra: [],
  };

  function takeValue(index, name) {
    const value = argv[index + 1];
    if (value == null || (value.startsWith("-") && value !== "-")) {
      args.errors.push(`${name} requires a value.`);
      return { value: null, next: index };
    }
    return { value, next: index + 1 };
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      for (let j = i + 1; j < argv.length; j++) {
        if (!args.url) args.url = argv[j];
        else args.extra.push(argv[j]);
      }
      break;
    }
    if (arg === "-h" || arg === "--help") { args.help = true; continue; }
    if (arg === "-v" || arg === "--version") { args.version = true; continue; }
    if (arg === "--list") { args.list = true; continue; }
    if (arg === "-q" || arg === "--quiet") { args.quiet = true; continue; }
    if (arg === "--debug") { args.debug = true; continue; }
    if (arg === "--raw") { args.raw = true; continue; }
    if (arg === "--no-raw") { args.raw = false; continue; }

    if (arg === "-p" || arg === "--platform") {
      const taken = takeValue(i, arg);
      if (taken.value) args.platform = taken.value;
      i = taken.next;
      continue;
    }
    if (arg.startsWith("--platform=")) { args.platform = arg.slice("--platform=".length); continue; }

    if (arg === "-l" || arg === "--locale") {
      const taken = takeValue(i, arg);
      if (taken.value) {
        if (taken.value === "id" || taken.value === "en") args.locale = taken.value;
        else args.errors.push("--locale must be id or en.");
      }
      i = taken.next;
      continue;
    }
    if (arg.startsWith("--locale=")) {
      const value = arg.slice("--locale=".length);
      if (value === "id" || value === "en") args.locale = value;
      else args.errors.push("--locale must be id or en.");
      continue;
    }

    if (arg === "-o" || arg === "--out") {
      const taken = takeValue(i, arg);
      if (taken.value) args.out = taken.value;
      i = taken.next;
      continue;
    }
    if (arg.startsWith("--out=")) { args.out = arg.slice("--out=".length); continue; }

    if (arg === "--timeout") {
      const taken = takeValue(i, arg);
      if (taken.value) {
        const value = Number(taken.value);
        if (Number.isFinite(value) && value > 0) args.timeout = value;
        else args.errors.push("--timeout must be a positive number.");
      }
      i = taken.next;
      continue;
    }
    if (arg.startsWith("--timeout=")) {
      const value = Number(arg.slice("--timeout=".length));
      if (Number.isFinite(value) && value > 0) args.timeout = value;
      else args.errors.push("--timeout must be a positive number.");
      continue;
    }

    if (arg === "--retries") {
      const taken = takeValue(i, arg);
      if (taken.value) {
        const value = Number(taken.value);
        if (Number.isInteger(value) && value >= 0 && value <= 5) args.retries = value;
        else args.errors.push("--retries must be an integer from 0 to 5.");
      }
      i = taken.next;
      continue;
    }
    if (arg.startsWith("--retries=")) {
      const value = Number(arg.slice("--retries=".length));
      if (Number.isInteger(value) && value >= 0 && value <= 5) args.retries = value;
      else args.errors.push("--retries must be an integer from 0 to 5.");
      continue;
    }

    if (arg === "--action-id") {
      const taken = takeValue(i, arg);
      if (taken.value) args.actionId = taken.value;
      i = taken.next;
      continue;
    }
    if (arg.startsWith("--action-id=")) { args.actionId = arg.slice("--action-id=".length); continue; }

    if (arg === "--download") {
      const next = argv[i + 1];
      if (next && !next.startsWith("-") && (args.url || !/^https?:\/\//i.test(next))) {
        args.download = next;
        i++;
      } else {
        args.download = "best";
      }
      continue;
    }
    if (arg.startsWith("--download=")) {
      args.download = arg.slice("--download=".length) || "best";
      continue;
    }

    if (arg === "--download-out") {
      const taken = takeValue(i, arg);
      if (taken.value) args.downloadOut = taken.value;
      i = taken.next;
      continue;
    }
    if (arg.startsWith("--download-out=")) { args.downloadOut = arg.slice("--download-out=".length); continue; }

    if (arg.startsWith("-")) {
      args.errors.push(`Unknown option: ${arg}`);
      continue;
    }
    if (!args.url) args.url = arg;
    else args.extra.push(arg);
  }

  if (args.extra.length) {
    args.errors.push(`Unexpected argument(s): ${args.extra.join(" ")}`);
  }
  return args;
}

function printHelp(stream = process.stdout) {
  stream.write(HELP_TEXT);
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function log(args, ...parts) {
  if (!args.quiet) console.error("[omdown]", ...parts);
}

function truncate(text, max) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 3))}...`;
}

function writeJsonFile(file, value) {
  if (!file || file === "-") return null;
  const outPath = path.resolve(process.cwd(), file);
  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    return outPath;
  } catch (error) {
    throw new OmdownError("WRITE_FAILED", `Could not write ${outPath}: ${error.message}`, {
      retryable: false,
      details: { path: outPath, cause: error.message },
    });
  }
}

function selectDownloadTarget(result, id) {
  if (!id || id === "best") {
    return result.download && result.download.recommended ? result.download.recommended : null;
  }
  if (id === "thumbnail") {
    return result.thumbnail && result.thumbnail.url ? result.thumbnail : null;
  }
  const candidates = [
    ...(result.formats || []),
    ...(result.images || []),
    ...((result.carousel && result.carousel.items) || []),
    ...((result.audio && result.audio.items) || []),
    ...((result.video && result.video.items) || []),
  ];
  return candidates.find((candidate) =>
    candidate.id === id || candidate.format_id === id || candidate.formatId === id
  ) || null;
}

function defaultDownloadName(result, target) {
  if (target && target.filename) return target.filename;
  const ext = (target && target.ext) ||
    (target && target.type === "video" ? "mp4" : null) ||
    (target && target.type === "audio" ? "mp3" : null) ||
    "bin";
  return `${result.platform || "media"}_${slugifyTitle(result.content && result.content.title, 40)}.${ext}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }
  if (args.version) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  if (args.list) {
    printJson({ count: PLATFORMS.length, platforms: listPlatforms() });
    return;
  }
  if (args.errors.length) {
    for (const error of args.errors) console.error(`[omdown] ${error}`);
    printHelp(process.stderr);
    process.exitCode = 1;
    return;
  }
  if (!args.url) {
    printHelp(process.stderr);
    process.exitCode = 1;
    return;
  }

  const startedAt = new Date();
  const session = createSession({
    locale: args.locale,
    timeout: args.timeout,
    retries: args.retries,
    actionId: args.actionId,
    debug: args.debug,
  });

  let exitCode = 0;
  let result;

  try {
    result = await scrape(args.url, {
      platform: args.platform,
      locale: args.locale,
      timeout: args.timeout,
      retries: args.retries,
      actionId: args.actionId,
      raw: args.raw,
      includeRaw: args.raw,
      debug: args.debug,
      session,
    });

    if (args.download) {
      try {
        const target = selectDownloadTarget(result, args.download);
        if (!target) {
          throw new OmdownError("FORMAT_NOT_FOUND", `No downloadable format found for "${args.download}".`, {
            retryable: false,
            details: { available_formats: result.available_formats },
          });
        }
        const output = args.downloadOut ||
          path.join(process.cwd(), "downloads", defaultDownloadName(result, target));
        const download = await downloadMedia(target, {
          session,
          out: output,
          timeout: args.timeout,
        });
        result.extra.downloaded = {
          ok: true,
          path: download.path,
          bytes: download.bytes,
          status: download.status,
          content_type: download.content_type,
          content_range: download.content_range,
        };
        log(args, `downloaded ${download.bytes} bytes -> ${download.path}`);
      } catch (error) {
        const err = error instanceof OmdownError
          ? error
          : new OmdownError("DOWNLOAD_FAILED", error.message || String(error), { retryable: false });
        result.extra.downloaded = { ok: false, error: err.toJSON() };
        result.status = "partial";
        result.error = {
          code: err.code,
          message: err.message,
          details: err.details,
          retryable: err.retryable,
        };
        if (result.validation && Array.isArray(result.validation.warnings)) {
          result.validation.warnings.push(`Download failed: ${err.message}`);
          result.validation.status = "warnings";
          result.validation.summary = "Metadata is valid, but the requested download failed.";
        }
        log(args, `download failed: ${err.message}`);
        exitCode = 2;
      }
    }

    const outPath = writeJsonFile(args.out, result);
    printJson(result);
    log(args, `${result.status}: ${result.platform_name || "unknown"}${result.content.title ? ` - ${truncate(result.content.title, 80)}` : ""}`);
    if (outPath) log(args, `saved ${outPath}`);
    if (exitCode === 0 && result.status === "partial") exitCode = 2;
  } catch (error) {
    const err = error instanceof OmdownError
      ? error
      : new OmdownError("UNKNOWN", error.message || String(error), {
          retryable: false,
          details: { cause: error.message || String(error) },
        });
    result = buildErrorResult(args.url, err, {
      platform: args.platform,
      locale: args.locale,
      timeout: args.timeout,
      retries: args.retries,
      actionId: args.actionId,
      includeRaw: args.raw,
      startedAt,
    });
    const outPath = writeJsonFile(args.out, result);
    printJson(result);
    log(args, `error: ${err.message}`);
    if (outPath) log(args, `saved ${outPath}`);
    exitCode = 1;
  }

  process.exitCode = exitCode;
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[omdown] fatal:", error && error.message ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = {
  scrape,
  scrapeRaw,
  downloadMedia,
  detectPlatform,
  listPlatforms,
  createSession,
  buildErrorResult,
  OmdownError,
  OmdownSession,
  VERSION,
  SCHEMA_VERSION,
  BASE,
  DEFAULT_ACTION_ID,
  PLATFORMS,
};

