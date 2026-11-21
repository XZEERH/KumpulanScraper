#!/usr/bin/env node

/**
 * Name : Omdown All In One Downloader (Fixed)
 * Creator: Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps : https://www(.)omdown(.)site
 * Type : Scraper/JSON
 * Description : Resolves media metadata and download URLs from omdown.site.
 * Note : Udah diperbaiki scrape omdown, udah bisa dipakai.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const VERSION = "2.0.0";
const BASE = "https://www.omdown.site";
const ACTION_ID = "708399a12b89c0c44316117a83426033874649eaec";
const LOCALE = "id";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const LANG = "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7";
const ARCHIVES = new Set(["all-playlist", "all-slides"]);
const PLATFORMS = [
  ["PineDrama", "video", /(?:^|\.)shortdrama\.tiktok\.com$/i], ["TikTok", "social", /(?:^|\.)tiktok\.com$/i],
  ["Douyin", "video", /(?:^|\.)(?:douyin\.com|iesdouyin\.com)$/i], ["Kuaishou", "video", /(?:^|\.)(?:kuaishou\.com|kwai\.com)$/i],
  ["SnackVideo", "video", /(?:^|\.)(?:snackvideo\.com|sck\.io)$/i], ["RedNote", "social", /(?:^|\.)(?:xiaohongshu\.com|rednote\.com|xhslink\.com)$/i],
  ["YouTube", "video", /(?:^|\.)(?:youtube\.com|youtu\.be)$/i], ["Instagram", "social", /(?:^|\.)(?:instagram\.com|instagr\.am|ig\.me)$/i],
  ["X", "social", /(?:^|\.)(?:x\.com|twitter\.com|t\.co)$/i], ["Facebook", "social", /(?:^|\.)(?:facebook\.com|fb\.watch|fb\.com)$/i],
  ["Threads", "social", /(?:^|\.)threads\.(?:net|com)$/i], ["Bluesky", "social", /(?:^|\.)(?:bsky\.app|bsky\.social)$/i],
  ["Reddit", "social", /(?:^|\.)(?:reddit\.com|redd\.it)$/i], ["CapCut", "video", /(?:^|\.)capcut\.com$/i],
  ["Snapchat", "social", /(?:^|\.)snapchat\.com$/i], ["Twitch", "video", /(?:^|\.)twitch\.tv$/i],
  ["Bilibili", "video", /(?:^|\.)(?:bilibili\.com|bilibili\.tv|b23\.tv|bili\.im)$/i], ["Dailymotion", "video", /(?:^|\.)(?:dailymotion\.com|dai\.ly)$/i],
  ["Lahelu", "video", /(?:^|\.)lahelu\.com$/i], ["Spotify", "audio", /(?:^|\.)(?:spotify\.com|spoti\.fi)$/i],
  ["SoundCloud", "audio", /(?:^|\.)soundcloud\.com$/i], ["Apple Music", "audio", /(?:^|\.)(?:music\.apple\.com|apple\.co)$/i],
  ["Pinterest", "image", /(?:^|\.)(?:pinterest\.(?:com|co\.[a-z]{2}|[a-z]{2,3})|pin\.it)$/i], ["DeviantArt", "image", /(?:^|\.)deviantart\.com$/i],
  ["Pixiv", "image", /(?:^|\.)pixiv\.net$/i], ["MangaDex", "image", /(?:^|\.)mangadex\.org$/i],
  ["Imgur", "image", /(?:^|\.)imgur\.com$/i],
];
const asStr = (v) => (typeof v === "string" ? v.trim() : v == null ? null : String(v));
const keyOf = (name) => String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const unique = (items) => [...new Set(items.filter(Boolean))];
const isToken = (v) => !!asStr(v)?.includes("/api/media/stream");
function normalizeUrl(input) {
  if (typeof input !== "string" || !input.trim()) return null;
  const value = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && url.hostname.includes(".") ? url.toString() : null;
  } catch { return null; }
}
function detectPlatform(input) {
  const value = normalizeUrl(input);
  if (!value) return null;
  const host = new URL(value).hostname;
  for (const [name, category, pattern] of PLATFORMS) if (pattern.test(host)) return { name, key: keyOf(name), category };
  return null;
}
const listPlatforms = () => PLATFORMS.map(([name, category]) => ({ name, key: keyOf(name), category }));
function abs(value) {
  const text = asStr(value);
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith("//")) return `https:${text}`;
  return text.startsWith("/") ? `${BASE}${text}` : null;
}
// RSC parsing
function parseRsc(text) {
  const map = Object.create(null);
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\n") { i++; continue; }
    const m = /^([0-9a-f]+):([A-Za-z])([0-9a-f]*),/.exec(text.slice(i));
    if (!m) { const next = text.indexOf("\n", i); if (next < 0) break; i = next + 1; continue; }
    const start = i + m[0].length;
    if (m[2] === "T" && m[3]) {
      const size = parseInt(m[3], 16);
      map[m[1]] = text.slice(start, start + size);
      i = start + size;
    } else {
      const next = text.indexOf("\n", start);
      map[m[1]] = text.slice(start, next < 0 ? text.length : next);
      i = next < 0 ? text.length : next;
    }
  }
  return map;
}
function parseBalancedJson(text, start) {
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
    }
  }
  return null;
}
function extractActionJson(text) {
  for (const match of text.matchAll(/\{\s*"success"\s*:/g)) {
    const parsed = parseBalancedJson(text, match.index);
    if (parsed && "success" in parsed) return parsed;
  }
  return null;
}
const PRIMITIVES = { $undefined: undefined, $null: null, $true: true, $false: false, $NaN: NaN, $Infinity: Infinity, "$-Infinity": -Infinity };
function resolveRefs(value, map, seen = new Set()) {
  if (typeof value === "string") {
    if (value in PRIMITIVES) return PRIMITIVES[value];
    if (!/^\$[0-9a-f]+$/.test(value)) return value;
    const id = value.slice(1);
    if (seen.has(id) || map[id] === undefined) return undefined;
    seen.add(id);
    let parsed;
    try { parsed = JSON.parse(map[id]); } catch { parsed = map[id]; }
    const out = resolveRefs(parsed, map, seen);
    seen.delete(id);
    return out;
  }
  if (Array.isArray(value)) return value.map((item) => resolveRefs(item, map, seen));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveRefs(v, map, seen)]));
  return value;
}
function findActionId(text) {
  const index = String(text || "").indexOf("resolveMediaAction");
  if (index < 0) return null;
  const found = [...text.slice(Math.max(0, index - 1500), index).matchAll(/createServerReference\)?\(\s*["']([0-9a-f]{32,})["']/g)];
  return found.length ? found.at(-1)[1] : null;
}
const scriptSrcs = (html) => [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
  .map((match) => abs(match[1])).filter((url) => url && url.startsWith(BASE));
// Session / action
class Session {
  constructor(options = {}) {
    this.locale = options.locale === "en" ? "en" : LOCALE;
    this.timeout = Math.max(1000, Number(options.timeout) || 30000);
    this.cookies = new Map();
    this.actionId = options.actionId || null;
    this.ready = false;
    this.requests = 0;
  }
  headers(extra = {}) {
    const headers = { "user-agent": UA, "accept-language": LANG, ...extra };
    const cookie = [...this.cookies].map(([key, value]) => `${key}=${value}`).join("; ");
    if (cookie && !headers.cookie) headers.cookie = cookie;
    return headers;
  }
  store(response) {
    const values = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : (response.headers.get("set-cookie") || "").split(/,(?=\s*[^;=,\s]+=)/);
    for (const raw of values) {
      const pair = String(raw || "").split(";")[0], eq = pair.indexOf("=");
      if (eq > 0) this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  async init() {
    if (this.ready) return this;
    const endpoint = `${BASE}/${this.locale}`;
    this.requests++;
    const response = await fetch(endpoint, {
      headers: this.headers({ accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "sec-fetch-site": "none", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document" }),
      signal: AbortSignal.timeout(this.timeout),
    });
    this.store(response);
    const html = await response.text();
    if (!response.ok) throw new Error(`Homepage returned HTTP ${response.status}.`);
    this.actionId = this.actionId || findActionId(html) || await discoverActionId(html, this) || ACTION_ID;
    this.ready = true;
    return this;
  }
}
async function discoverActionId(html, session) {
  const results = await Promise.allSettled(scriptSrcs(html).map(async (src) => {
    session.requests++;
    const response = await fetch(src, {
      headers: session.headers({ accept: "*/*", "sec-fetch-site": "same-origin", "sec-fetch-mode": "no-cors", "sec-fetch-dest": "script" }),
      signal: AbortSignal.timeout(session.timeout),
    });
    session.store(response);
    return response.ok ? findActionId(await response.text()) : null;
  }));
  return results.find((result) => result.status === "fulfilled" && result.value)?.value || null;
}
async function postAction(session, url, platformName) {
  const endpoint = `${BASE}/${session.locale}`;
  session.requests++;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: session.headers({ "content-type": "text/plain;charset=UTF-8", "next-action": session.actionId,
      accept: "text/x-component", origin: BASE, referer: endpoint, "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors", "sec-fetch-dest": "empty" }),
    body: JSON.stringify([url, platformName, session.locale]),
    signal: AbortSignal.timeout(session.timeout),
  });
  session.store(response);
  const text = await response.text(), json = extractActionJson(text);
  if (!json) {
    const error = new Error(text.includes("Akses ditolak") ? "Access denied by omdown.site anti-bot." : `Action returned HTTP ${response.status}.`);
    error.status = response.status;
    error.antiBot = text.includes("Akses ditolak");
    throw error;
  }
  if (json.success !== true) {
    const error = new Error(asStr(json.error) || "The server action failed.");
    error.status = response.status;
    throw error;
  }
  return { data: resolveRefs(json.data, parseRsc(text)), meta: { action_id: session.actionId, http_status: response.status, resolve_time_ms: null } };
}
async function resolveMedia(session, url, platformName) {
  await session.init();
  const started = Date.now();
  try {
    const output = await postAction(session, url, platformName);
    output.meta.resolve_time_ms = Date.now() - started;
    return output;
  } catch (error) {
    if (!(error.status === 403 || error.status === 404 || error.antiBot)) throw error;
    session.ready = false;
    session.cookies.clear();
    await session.init();
    const output = await postAction(session, url, platformName);
    output.meta.resolve_time_ms = Date.now() - started;
    return output;
  }
}
// Value helpers
function parseCount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const match = /^([\d.,]+)([a-z]+)?$/.exec(value.trim().toLowerCase().replace(/\s+/g, ""));
  if (!match) return null;
  const suffix = match[2] || "";
  let multiplier = 1;
  if (/^(k|rb|ribu)$/.test(suffix)) multiplier = 1e3;
  else if (/^(m|jt|juta)$/.test(suffix)) multiplier = 1e6;
  else if (/^(b|bn|miliar)$/.test(suffix)) multiplier = 1e9;
  const number = Number(multiplier > 1 ? match[1].replace(",", ".") : match[1].replace(/,/g, ""));
  return Number.isFinite(number) ? Math.round(number * multiplier) : null;
}
function compact(value) {
  if (value == null) return null;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
}
function parseDuration(value) {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(value || "").trim());
  if (!match) return null;
  return match[3] ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : Number(match[1]) * 60 + Number(match[2]);
}
function parseResolution(text) {
  let match = /(\d{3,4})p\b/i.exec(String(text || ""));
  if (match) return { label: `${match[1]}p`, width: null, height: Number(match[1]) };
  match = /(\d{3,4})\s*[x×]\s*(\d{3,4})/i.exec(String(text || ""));
  return match ? { label: `${match[1]}x${match[2]}`, width: Number(match[1]), height: Number(match[2]) } : null;
}
const parseBitrate = (text) => Number(/(\d{2,4})\s*kbps/i.exec(String(text || ""))?.[1]) || null;
const MIME = {
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mp3: "audio/mpeg", m4a: "audio/mp4",
  aac: "audio/aac", ogg: "audio/ogg", wav: "audio/wav", jpeg: "image/jpeg", jpg: "image/jpeg",
  png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif", zip: "application/zip",
};
const mimeFor = (ext) => MIME[String(ext || "").toLowerCase()] || null;
function extFor(kind, text) {
  const match = /\.(mp4|webm|mov|mp3|m4a|aac|ogg|wav|jpe?g|png|webp|gif|avif)\b/i.exec(String(text || ""));
  if (match) return match[1].toLowerCase().replace("jpg", "jpeg");
  return kind === "video" ? "mp4" : kind === "audio" ? "mp3" : kind === "image" ? "jpeg" : "zip";
}
function slug(value, max = 40) {
  const text = String(value || "").replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "");
  return (text || "download").slice(0, max).replace(/^_+|_+$/g, "") || "download";
}
function parseTrack(label) {
  let text = asStr(label);
  const match = text && /^(?:Lagu\s*)?#(\d+)[.:\s-]+/i.exec(text);
  if (!match) return null;
  const index = Number(match[1]);
  text = text.slice(match[0].length);
  const duration = /\((\d{1,2}:\d{2})\)\s*(?:-\s*MP3(?:\s*HQ)?)?\s*$/i.exec(text);
  const durationLabel = duration ? duration[1] : null;
  if (duration) text = text.slice(0, duration.index).trim();
  text = text.replace(/\s*-\s*MP3(?:\s*HQ)?\s*$/i, "").trim();
  const parts = text.split(/\s+-\s+/);
  return { index, duration_label: durationLabel, duration_seconds: parseDuration(durationLabel),
    title: (parts.length >= 2 ? parts[0] : text).trim() || null,
    artist: parts.length >= 2 ? parts.slice(1).join(" - ").trim() : null };
}
const FB_STAT = /^\s*[\d.,]+\s*(?:jt|rb|k|m|b|juta|ribu)?\s*(?:tayangan|tanggapan|suka|komentar|bagikan|penayangan|views?|likes?|comments?|shares?|reactions?)\b/i;
const splitPipe = (value) => String(value || "").split(/\s*\|\s*/).map((part) => part.trim()).filter(Boolean);
function cleanTitle(raw, platformKey) {
  let text = asStr(raw);
  if (!text) return null;
  if (platformKey === "facebook") {
    const parts = splitPipe(text);
    while (parts.length && FB_STAT.test(parts[0])) parts.shift();
    text = parts.filter((part) => !/^facebook$/i.test(part)).join(" | ") || text.replace(/\s*\|\s*Facebook\s*$/i, "");
  }
  return text.replace(/[\u0000\u200b]/g, "").replace(/\s+/g, " ").trim() || null;
}
function parseFacebookStats(text) {
  const value = String(text || ""), output = {};
  const patterns = {
    views: /([\d.,]+)\s*(jt|rb|k|m|b|juta|ribu)?\s*(?:tayangan|penayangan|views?)\b/i,
    comments: /([\d.,]+)\s*(jt|rb|k|m|b|juta|ribu)?\s*(?:tanggapan|komentar|comments?|replies)\b/i,
    likes: /([\d.,]+)\s*(jt|rb|k|m|b|juta|ribu)?\s*(?:suka|likes?|reactions?)\b/i,
    shares: /([\d.,]+)\s*(jt|rb|k|m|b|juta|ribu)?\s*(?:bagikan|shares?)\b/i,
  };
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = pattern.exec(value);
    if (match) output[key] = `${match[1]} ${match[2] || ""}`.trim();
  }
  return output;
}
function cleanFacebookAuthor(raw) {
  const match = /\(@([^)]+)\)/.exec(String(raw || ""));
  return match ? match[1].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}
// Formats / slides
function uniqueFilename(format, title, platformKey, used) {
  const base = `omdown.site_${platformKey}_${slug(title, 30)}`;
  let name;
  if (format.is_archive) name = `${base}_${format.id === "all-playlist" ? "playlist" : "slides"}.zip`;
  else if (format.kind === "video") name = `${base}_${slug(format.resolution?.label || format.quality || "video", 20).replace(/\s+/g, "_")}.${format.ext}`;
  else if (format.kind === "audio") name = `${base}_${format.bitrate_kbps ? `${format.bitrate_kbps}kbps` : "audio"}${format.is_preview ? "_preview" : ""}.${format.ext}`;
  else name = `${base}.${format.ext}`;
  name = name.replace(/_+/g, "_");
  let output = name, counter = 2;
  while (used.has(output)) {
    const dot = name.lastIndexOf(".");
    output = `${name.slice(0, dot)}_${counter++}${name.slice(dot)}`;
  }
  used.add(output);
  return output;
}
function buildFormats(data, ctx) {
  const used = new Set();
  return (Array.isArray(data.formats) ? data.formats : []).map((raw, index) => {
    const id = asStr(raw.id) || `format_${index + 1}`, kind = (asStr(raw.kind) || "file").toLowerCase();
    const quality = asStr(raw.quality), label = asStr(raw.label), rawUrl = asStr(raw.downloadUrl);
    const isArchive = ARCHIVES.has(id);
    const ext = (asStr(raw.ext) || extFor(kind, `${label || ""} ${quality || ""}`)).replace(/^\./, "").toLowerCase();
    const resolution = parseResolution(`${quality || ""} ${label || ""} ${raw.description || ""}`);
    const track = kind === "audio" ? parseTrack(label) : null;
    const format = {
      id, label, kind, quality, ext, mime_type: mimeFor(ext),
      download_url: isArchive ? null : abs(rawUrl), thumbnail_url: abs(raw.thumbnailUrl), track_url: abs(raw.trackUrl),
      has_watermark: typeof raw.hasWatermark === "boolean" ? raw.hasWatermark : null, is_archive: isArchive,
      is_preview: kind === "audio" && (/_preview/i.test(id) || /preview/i.test(`${quality || ""} ${label || ""}`)),
      requires_cookie: isToken(rawUrl), bitrate_kbps: parseBitrate(`${quality || ""} ${label || ""} ${raw.description || ""}`),
      resolution, width: resolution?.width ?? null, height: resolution?.height ?? null,
      track_number: track?.index ?? null, track_title: track?.title ?? null, track_artist: track?.artist ?? null,
      duration_label: track?.duration_label ?? null, duration_seconds: track?.duration_seconds ?? null, filename: null,
    };
    format.filename = uniqueFilename(format, ctx.title, ctx.platform.key, used);
    return format;
  });
}
function buildSlides(data, ctx) {
  return (Array.isArray(data.slides) ? data.slides : []).map((raw, index) => {
    const type = (asStr(raw.type) || "image").toLowerCase();
    const url = abs(raw.url || raw.previewUrl || raw.thumbnailUrl);
    const ext = type === "video" ? "mp4" : extFor("image", raw.label);
    const slideIndex = Number.isFinite(Number(raw.index)) ? Number(raw.index) : index;
    return { index: slideIndex, type, label: asStr(raw.label), url, download_url: url,
      thumbnail_url: abs(raw.thumbnailUrl), preview_url: abs(raw.previewUrl), ext, mime_type: mimeFor(ext),
      requires_cookie: isToken(url), is_video: type === "video", is_image: type === "image",
      filename: `omdown.site_${ctx.platform.key}_${String(index + 1).padStart(2, "0")}_${type === "video" ? "Video" : "Photo"}_Slide_${slideIndex + 1}.${ext}` };
  });
}
function buildImages(formats, slides, data) {
  const output = [], seen = new Set();
  const add = (item) => { if (item.url && !seen.has(item.url)) { seen.add(item.url); output.push(item); } };
  for (const format of formats) {
    if (format.kind !== "image" || format.is_archive) continue;
    add({ role: "image", label: format.label, url: format.download_url, thumbnail_url: format.thumbnail_url,
      ext: format.ext, requires_cookie: format.requires_cookie, source: "format" });
  }
  for (const slide of slides) {
    if (!slide.is_image) continue;
    add({ role: "slide", label: slide.label, url: slide.download_url, thumbnail_url: slide.thumbnail_url,
      ext: slide.ext, requires_cookie: slide.requires_cookie, source: "slide" });
  }
  for (const [role, url, label] of [["thumbnail", abs(data.thumbnailUrl), "Thumbnail"], ["avatar", abs(data.authorAvatar), "Author avatar"]]) {
    if (url) add({ role, label, url, thumbnail_url: url, ext: extFor("image", url), requires_cookie: isToken(url), source: "response" });
  }
  return output;
}
// Sections / normalize
function blank() {
  return {
    content: { title: null, type: "unknown", published_at: null, hashtags: [], mentions: [], urls: [] },
    author: { name: null, username: null, handle: null, avatar: null, profile_url: null, verified: null, followers: null, following: null },
    statistics: { available: false, views: null, likes: null, comments: null, shares: null, formatted: {} },
    images: [], video: { available: false, count: 0, primary: null, items: [] },
    audio: { available: false, count: 0, preview_count: 0, primary: null, music: null, items: [], notes: [] },
    playlist: { is_playlist: false, track_count: 0, tracks: [], total_duration_seconds: null, archive: null },
    carousel: { is_carousel: false, count: 0, image_count: 0, video_count: 0, items: [], archive: null },
    formats: [],
    media: { ready: false, video_count: 0, audio_count: 0, image_count: 0, slide_count: 0, archive_count: 0, primary: null, requires_cookie: false, embed_url: null },
    download: { ready: false, recommended: null, alternatives: [], archive_entries: [], requires_cookie: false, cookie_names: [], referer: null },
    thumbnail: { available: false, url: null, ext: null, mime_type: null, requires_cookie: false },
    technical: {}, validation: { valid: false, status: "failed", errors: [], warnings: [] },
    attribution: {}, extra: { archives: [], music: null, profile: null, embed_url: null, notes: [] },
  };
}
function normalize(data, ctx) {
  const key = ctx.platform.key, title = cleanTitle(data.title, key);
  const formats = buildFormats(data, { ...ctx, title }), slides = buildSlides(data, ctx);
  const mediaFormats = formats.filter((f) => !f.is_archive), archives = formats.filter((f) => f.is_archive);
  const videos = mediaFormats.filter((f) => f.kind === "video"), audios = mediaFormats.filter((f) => f.kind === "audio");
  const images = buildImages(formats, slides, data), previews = audios.filter((f) => f.is_preview);
  const tracks = audios.filter((f) => f.track_number != null || f.track_url);
  let type = "unknown";
  if (tracks.length > 1) type = "playlist";
  else if (videos.length) type = slides.length > 1 || data.isCarousel === true ? "carousel" : "video";
  else if (audios.length) type = "audio";
  else if (slides.length > 1 || data.isCarousel === true) type = "carousel";
  else if (images.length || slides.length) type = "image";
  const text = title || "", durationLabel = asStr(data.durationLabel);
  const content = {
    title, description: asStr(data.description), caption: title, type,
    duration_label: durationLabel, duration_seconds: parseDuration(durationLabel),
    is_video: type === "video", is_audio: type === "audio", is_image: type === "image",
    is_carousel: type === "carousel", is_playlist: type === "playlist", published_at: null,
    hashtags: [...text.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]),
    mentions: [...text.matchAll(/@([\p{L}\p{N}_.]+)/gu)].map((m) => m[1]),
    urls: [...text.matchAll(/https?:\/\/[^\s]+/g)].map((m) => m[0]),
  };
  let authorRaw = key === "facebook" ? cleanFacebookAuthor(data.author) : asStr(data.author);
  let name = authorRaw, handle = null;
  const match = authorRaw && /^(.*?)\s*\(@([^)]+)\)\s*$/.exec(authorRaw);
  if (match) { name = asStr(match[1]); handle = asStr(match[2]); }
  const profile = data.profile && typeof data.profile === "object" ? data.profile : {};
  name = asStr(profile.name) || asStr(profile.displayName) || name;
  handle = asStr(profile.username) || asStr(profile.handle) || handle;
  const followers = parseCount(profile.followers ?? profile.followerCount);
  const following = parseCount(profile.following ?? profile.followingCount);
  const author = {
    name, username: handle, handle: handle ? `@${String(handle).replace(/^@/, "")}` : null,
    avatar: abs(profile.avatarUrl || profile.avatar), profile_url: asStr(profile.url || profile.profileUrl),
    verified: typeof profile.verified === "boolean" ? profile.verified : null, followers, following,
  };
  const statsSource = { ...(data.stats && typeof data.stats === "object" ? data.stats : {}) };
  if (key === "facebook") for (const [stat, value] of Object.entries(parseFacebookStats(data.title))) if (statsSource[stat] == null) statsSource[stat] = value;
  const statistics = { available: false, formatted: {} };
  for (const stat of ["views", "likes", "comments", "shares"]) {
    const value = parseCount(statsSource[stat] ?? profile[stat] ?? profile[`${stat}Count`]);
    statistics[stat] = value;
    statistics.formatted[stat] = value == null ? null : compact(value);
    if (value != null) statistics.available = true;
  }
  const primaryVideo = [...videos].sort((a, b) => (b.height || 0) - (a.height || 0) || (b.bitrate_kbps || 0) - (a.bitrate_kbps || 0))[0] || null;
  const video = { available: videos.length > 0, count: videos.length, primary: primaryVideo, items: videos };
  const music = data.music ? { title: asStr(data.music.title), author: asStr(data.music.author), play_url: abs(data.music.playUrl), requires_cookie: isToken(data.music.playUrl) } : null;
  const audio = { available: audios.length > 0 || !!music, count: audios.length, preview_count: previews.length,
    primary: audios[0] || null, music, items: audios,
    notes: previews.length ? ["Some tracks are previews (about 30 seconds), not full songs."] : [] };
  const total = tracks.reduce((sum, track) => sum + (track.duration_seconds || 0), 0);
  const playlist = { is_playlist: tracks.length > 1, track_count: tracks.length,
    tracks: tracks.map((track) => ({ index: track.track_number, id: track.id, title: track.track_title || track.label,
      artist: track.track_artist, duration_label: track.duration_label, duration_seconds: track.duration_seconds,
      quality: track.quality, is_preview: track.is_preview, ext: track.ext,
      download_url: track.download_url, track_url: track.track_url })),
    total_duration_seconds: total || null, archive: archives.find((f) => f.id === "all-playlist")?.label || null };
  const imageCount = slides.filter((s) => s.is_image).length, videoSlideCount = slides.filter((s) => s.is_video).length;
  const carousel = { is_carousel: slides.length > 1 || data.isCarousel === true, count: slides.length,
    image_count: imageCount, video_count: videoSlideCount, items: slides,
    archive: archives.find((f) => f.id === "all-slides")?.label || null };
  const mediaPrimary = primaryVideo || audios[0] || images[0] || null;
  const media = { ready: mediaFormats.some((f) => f.download_url), video_count: videos.length, audio_count: audios.length,
    image_count: images.length, slide_count: slides.length, archive_count: archives.length,
    primary: mediaPrimary ? { id: mediaPrimary.id || mediaPrimary.role, kind: mediaPrimary.kind || "image",
      url: mediaPrimary.download_url || mediaPrimary.url, filename: mediaPrimary.filename || null } : null,
    requires_cookie: mediaFormats.some((f) => f.requires_cookie), embed_url: abs(data.embedUrl) };
  const recommended = primaryVideo || audios[0] || mediaFormats.find((f) => f.download_url) || null;
  const download = { ready: !!recommended,
    recommended: recommended ? { id: recommended.id, label: recommended.label, filename: recommended.filename,
      url: recommended.download_url, kind: recommended.kind, quality: recommended.quality,
      requires_cookie: recommended.requires_cookie } : null,
    alternatives: mediaFormats.filter((f) => f.download_url && f !== recommended).map((f) => ({ id: f.id, label: f.label,
      filename: f.filename, url: f.download_url, kind: f.kind, quality: f.quality, requires_cookie: f.requires_cookie })),
    archive_entries: archives.map((f) => ({ id: f.id, label: f.label, filename: f.filename, placeholder: true })),
    requires_cookie: !!recommended?.requires_cookie, cookie_names: recommended?.requires_cookie ? ["om_sec"] : [],
    referer: `${BASE}/${ctx.locale}` };
  const thumbUrl = abs(data.thumbnailUrl) || images.find((image) => image.role === "thumbnail")?.url || formats.find((f) => f.kind === "image")?.download_url || null;
  const thumbExt = thumbUrl ? extFor("image", thumbUrl) : null;
  const thumbnail = { available: !!thumbUrl, url: thumbUrl, ext: thumbExt, mime_type: thumbExt ? mimeFor(thumbExt) : null, requires_cookie: isToken(data.thumbnailUrl) };
  const technical = { action_id: ctx.meta.action_id, http_status: ctx.meta.http_status,
    resolve_time_ms: ctx.meta.resolve_time_ms, total_time_ms: Date.now() - ctx.started.getTime(), requests: ctx.session.requests };
  const placeholder = /^YouTube (Video|Channel)$/i.test(title || "") || (key === "youtube" && statistics.views === 0 && !videos.length);
  const errors = !title && !formats.length && !slides.length ? ["No title, formats, or slides were returned."] : [];
  const warnings = [];
  if (placeholder) warnings.push("The response looks like a generic placeholder; the content may be unavailable.");
  if (!download.ready) warnings.push("No downloadable format was returned.");
  const validation = { valid: errors.length === 0 && !placeholder, status: placeholder ? "placeholder" : errors.length ? "failed" : "passed", errors, warnings };
  const sourceUrl = asStr(data.rawUrl) || ctx.url;
  const attribution = { source: "omdown.site", source_url: BASE, original_url: sourceUrl,
    platform: ctx.platform.name, title, author: author.name, scraped_at: ctx.started.toISOString() };
  const extra = { archives: archives.map((f) => ({ id: f.id, label: f.label, filename: f.filename, placeholder: true })),
    music, profile: data.profile || null, embed_url: abs(data.embedUrl), notes: [] };
  if (archives.length) extra.notes.push("Archive placeholders are client-side ZIPs, not direct URLs.");
  if (previews.length) extra.notes.push("Some audio tracks are previews.");
  if (ctx.raw) extra.raw = data;
  const result = {
    status: "success", platform: key, platform_name: ctx.platform.name, platform_category: ctx.platform.category,
    url: ctx.url, source_url: sourceUrl, scraped_at: ctx.started.toISOString(), duration_ms: null,
    available_formats: mediaFormats.map((f) => f.id), available_qualities: unique(mediaFormats.map((f) => f.quality)),
    available_resolutions: unique(mediaFormats.map((f) => f.resolution?.label)), error: null,
    content, author, statistics, images, video, audio, playlist, carousel, formats, media, download,
    thumbnail, technical, validation, attribution, extra,
  };
  if (!validation.valid) {
    result.status = "partial";
    result.error = { code: placeholder ? "PLACEHOLDER_CONTENT" : "INVALID_CONTENT", message: errors[0] || warnings[0] || "Validation failed." };
  }
  result.duration_ms = Date.now() - ctx.started.getTime();
  technical.total_time_ms = result.duration_ms;
  return result;
}
function errorResult(input, error, options = {}) {
  const started = options.started || new Date(), detected = options.detected || detectPlatform(input);
  const message = error?.message || String(error);
  return { status: "error", platform: detected?.key ?? null, platform_name: detected?.name ?? null,
    platform_category: detected?.category ?? null, url: typeof input === "string" ? input : null,
    source_url: null, scraped_at: started.toISOString(), duration_ms: Date.now() - started.getTime(),
    error: { code: options.code || "ERROR", message }, ...blank(),
    validation: { valid: false, status: "failed", errors: [message], warnings: [] } };
}
function codeFor(error) {
  const message = String(error?.message || "");
  if (/timeout|timed out/i.test(message)) return "TIMEOUT";
  if (/batas|rate|terlalu banyak/i.test(message)) return "RATE_LIMITED";
  if (/access denied|anti-bot|ditolak/i.test(message)) return "ACCESS_DENIED";
  if (/gagal mengekstrak|private|privat|dihapus|unavailable|tidak ditemukan/i.test(message)) return "CONTENT_UNAVAILABLE";
  return "ACTION_FAILED";
}
const createSession = (options = {}) => new Session(options);
async function scrape(input, options = {}) {
  const started = new Date(), url = normalizeUrl(input);
  if (!url) return errorResult(input, new Error("The provided URL is not a valid HTTP(S) URL."), { code: "INVALID_URL", started });
  const detected = detectPlatform(url);
  if (!detected) return errorResult(url, new Error("This URL does not match any supported platform."), { code: "UNSUPPORTED_PLATFORM", started, detected });
  const session = options.session || createSession(options);
  try {
    const raw = await resolveMedia(session, url, options.platform || detected.name);
    const result = normalize(raw.data, { url, platform: detected, started, meta: raw.meta, session, locale: session.locale, raw: options.raw === true });
    Object.defineProperty(result, "session", { value: session, enumerable: false });
    return result;
  } catch (error) {
    return errorResult(url, error, { code: codeFor(error), started, detected });
  }
}
async function downloadMedia(target, options = {}) {
  const session = options.session || target?.session || createSession(options);
  let url = null, filename = null;
  if (typeof target === "string") url = target;
  else if (target?.download?.recommended) { url = target.download.recommended.url; filename = target.download.recommended.filename; }
  else if (target?.recommended) { url = target.recommended.url; filename = target.recommended.filename; }
  else { url = target?.download_url || target?.url || null; filename = target?.filename || null; }
  if (!url) throw new Error("No download URL was provided.");
  const response = await fetch(abs(url), {
    headers: session.headers({ accept: "*/*", referer: `${BASE}/${session.locale}` }),
    signal: AbortSignal.timeout(options.timeout || session.timeout),
  });
  if (!response.ok) throw new Error(`Download failed (HTTP ${response.status}).`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (options.out) {
    const outputPath = path.resolve(options.out);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    return { ok: true, path: outputPath, bytes: buffer.length, content_type: response.headers.get("content-type"), filename };
  }
  return { ok: true, bytes: buffer.length, content_type: response.headers.get("content-type"), filename, buffer };
}
// CLI
const HELP = `omdown-scraper ${VERSION}
Zero-dependency scraper for https://www.omdown.site
Usage:
  node scrape-omdown.js <url> [options]
  node scrape-omdown.js --list
Options:
  -p, --platform <name>   Override platform detection
  -l, --locale <id|en>    Site locale (default: id)
  -o, --out <file>        Output JSON file, or - for stdout (default: result.json)
      --raw               Include the raw action payload in extra.raw
      --timeout <ms>      Request timeout (default: 30000)
      --download <id>     Download best, thumbnail, or a format id
      --download-out <f>  Output path for --download
      --list              List supported platforms
  -q, --quiet             Suppress progress messages
  -h, --help              Show this help
  -v, --version           Show version`;
function parseArgs(argv) {
  const args = { url: null, out: "result.json", locale: "id", platform: null, download: null,
    downloadOut: null, raw: false, quiet: false, timeout: 30000, list: false, help: false, version: false };
  const take = (index, name) => { const value = argv[index + 1]; if (value == null) throw new Error(`${name} requires a value.`); return value; };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "-v" || arg === "--version") args.version = true;
    else if (arg === "--list") args.list = true;
    else if (arg === "-q" || arg === "--quiet") args.quiet = true;
    else if (arg === "--raw") args.raw = true;
    else if (arg === "-p" || arg === "--platform") args.platform = take(i++, arg);
    else if (arg === "-l" || arg === "--locale") args.locale = take(i++, arg) === "en" ? "en" : "id";
    else if (arg === "-o" || arg === "--out") args.out = take(i++, arg);
    else if (arg === "--timeout") args.timeout = Number(take(i++, arg)) || 30000;
    else if (arg === "--download") args.download = take(i++, arg);
    else if (arg === "--download-out") args.downloadOut = take(i++, arg);
    else if (!arg.startsWith("-")) args.url = arg;
  }
  return args;
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.version) return console.log(VERSION);
  if (args.help) return console.log(HELP);
  if (args.list) return console.log(JSON.stringify({ count: PLATFORMS.length, platforms: listPlatforms() }, null, 2));
  if (!args.url) { console.error(HELP); process.exitCode = 1; return; }
  const session = createSession({ locale: args.locale, timeout: args.timeout });
  const result = await scrape(args.url, { session, platform: args.platform, locale: args.locale, timeout: args.timeout, raw: args.raw });
  let exitCode = result.status === "success" ? 0 : result.status === "partial" ? 2 : 1;
  if (args.download) {
    try {
      const target = args.download === "best" ? result : args.download === "thumbnail" ? result.thumbnail : result.formats.find((format) => format.id === args.download);
      if (!target) throw new Error(`Format not found: ${args.download}`);
      const downloaded = await downloadMedia(target, { session, out: args.downloadOut || undefined, timeout: args.timeout });
      result.extra.downloaded = { ok: true, path: downloaded.path || null, bytes: downloaded.bytes, content_type: downloaded.content_type };
    } catch (error) {
      result.status = "partial";
      result.error = { code: "DOWNLOAD_FAILED", message: error.message };
      result.extra.downloaded = { ok: false, error: error.message };
      exitCode = 2;
    }
  }
  const json = JSON.stringify(result, null, 2);
  if (args.out === "-") process.stdout.write(`${json}\n`);
  else {
    fs.writeFileSync(args.out, json);
    if (!args.quiet) console.error(`[omdown] ${result.status} ${result.platform || ""} -> ${args.out}`);
  }
  process.exitCode = exitCode;
}
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((error) => { console.error(`[omdown] ${error.message}`); process.exitCode = 1; });
export { scrape, downloadMedia, detectPlatform, listPlatforms, createSession, Session, VERSION, PLATFORMS };
export default scrape;
