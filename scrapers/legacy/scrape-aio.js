#!/usr/bin/env node
"use strict";

/**
 * Name : All In One Downloader
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base web : https://www(.)videodownloadertools(.)com/
 * Type : Scraper
 * Description : layanan pengunduh video dan audio berbasis browser. Pengguna cukup memasukkan tautan media, kemudian layanan mencoba mengenali sumbernya, memproses tautan, dan menyediakan opsi unduhan berdasarkan format atau kualitas yang tersedia.
 * Note : bagian pemrosesan media kadang mengembalikan status: "failed" itu bukan masalah dari script, tetapi masalah selama kuota RapidAPI milik server videodownloadertools.com sudah/masih habis. agar pemrosesan media benar-benar mengembalikan opsi unduhan, kuota RapidAPI server sana harus tersedia (di luar kendali script ini)
 */

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const TARGET_URL = "https://www.videodownloadertools.com/";
const API_URL = new URL("fetch_api.php", TARGET_URL).toString();

const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

const TIMEOUT = 45000;
const MAX_RETRY = 2;

const PLATFORM_MAP = {
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "m.youtube.com": "YouTube",
  "instagram.com": "Instagram",
  "tiktok.com": "TikTok",
  "vt.tiktok.com": "TikTok",
  "facebook.com": "Facebook",
  "fb.watch": "Facebook",
  "m.facebook.com": "Facebook",
  "twitter.com": "Twitter/X",
  "x.com": "Twitter/X",
  "vimeo.com": "Vimeo",
  "dailymotion.com": "Dailymotion",
  "dai.ly": "Dailymotion",
  "pinterest.com": "Pinterest",
  "pin.it": "Pinterest",
  "reddit.com": "Reddit",
  "redd.it": "Reddit",
  "snapchat.com": "Snapchat",
  "linkedin.com": "LinkedIn",
  "tumblr.com": "Tumblr",
  "twitch.tv": "Twitch",
  "soundcloud.com": "SoundCloud",
  "deezer.com": "Deezer",
  "bilibili.com": "Bilibili",
  "b23.tv": "Bilibili",
  "imgur.com": "Imgur",
  "threads.net": "Threads",
  "threads.com": "Threads",
  "likee.video": "Likee",
  "likee.com": "Likee",
  "kwai.com": "Kwai",
  "kwai-video.com": "Kwai",
  "sharechat.com": "ShareChat",
  "moj.com": "Moj",
  "ted.com": "TED",
  "vk.com": "VK",
  "ok.ru": "Odnoklassniki",
  "weibo.com": "Weibo",
};

const AUDIO_EXT = ["mp3", "m4a", "aac", "opus", "ogg", "wav", "flac"];
const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "bmp", "heic", "avif"];
const VIDEO_EXT = ["mp4", "mov", "webm", "mkv", "avi", "flv", "3gp", "m4v"];
const GIF_EXT = ["gif"];

const ALL_CONTENT_TYPES = ["video", "audio", "photo", "reels", "shorts", "gif"];

const PLATFORM_CONTENT = {
  Instagram: ["video", "audio", "reels", "photo"],
  YouTube: ["video", "audio", "shorts"],
  TikTok: ["video", "audio", "shorts"],
  Facebook: ["video", "audio", "reels"],
  "Twitter/X": ["video", "audio", "gif", "photo"],
  Snapchat: ["video", "audio"],
  Threads: ["video", "photo"],
  Imgur: ["video", "photo", "gif"],
  Pinterest: ["video", "photo", "gif"],
  Tumblr: ["video", "photo", "gif"],
  Reddit: ["video", "audio", "gif"],
  Likee: ["video", "audio", "shorts"],
  Kwai: ["video", "audio"],
  Moj: ["video", "audio"],
  ShareChat: ["video", "audio"],
  Vimeo: ["video", "audio"],
  Dailymotion: ["video", "audio"],
  Bilibili: ["video", "audio"],
  Twitch: ["video", "audio"],
  SoundCloud: ["audio"],
  Deezer: ["audio"],
  TED: ["video", "audio"],
};

function log(...args) {
  if (process.env.SCRAPE_QUIET) return;
  process.stderr.write(args.join(" ") + "\n");
}

function findKey(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of Object.keys(obj)) {
    if (keys.includes(k.toLowerCase())) return obj[k];
  }
  return undefined;
}

function extFromUrl(url) {
  try {
    const p = new URL(url).pathname;
    const m = p.match(/\.([a-z0-9]{2,5})(?:$|\?)/i);
    return m ? m[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

function detectPlatform(rawUrl) {
  let host = "";
  try {
    host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return { name: null, host: null, detected: false };
  }
  let name = PLATFORM_MAP[host] || null;
  if (!name) {
    for (const domain of Object.keys(PLATFORM_MAP)) {
      if (host === domain || host.endsWith("." + domain)) {
        name = PLATFORM_MAP[domain];
        break;
      }
    }
  }
  return { name: name || "Unknown/Generic", host, detected: Boolean(name) };
}

function contentTypeFromUrl(rawUrl, platformName) {
  const u = String(rawUrl).toLowerCase();
  if (/\/reel\/|\/reels\//.test(u) || (platformName === "Instagram" && /\/p\//.test(u)))
    return "reels";
  if (/\/shorts\//.test(u)) return "shorts";
  if (/\.gif(\?|$)/.test(u)) return "gif";
  if (/\.(jpg|jpeg|png|webp)(\?|$)/.test(u)) return "photo";
  if (/\.(mp3|m4a|aac|opus|ogg)(\?|$)/.test(u)) return "audio";
  return "video";
}

function normalizeMediaOptions(medias) {
  if (!Array.isArray(medias)) return [];
  return medias.map((m, i) => {
    const url = m.url || m.link || m.download_url || "";
    let extension = (m.extension || m.ext || m.format || "").toString().toLowerCase();
    if (!extension) extension = extFromUrl(url) || "mp4";

    const rawType = (m.type || m.mediaType || "").toString().toLowerCase();
    let mediaType = rawType;
    if (AUDIO_EXT.includes(extension) || rawType.includes("audio")) mediaType = "audio";
    else if (IMAGE_EXT.includes(extension)) mediaType = "image";
    else if (GIF_EXT.includes(extension)) mediaType = "gif";
    else if (VIDEO_EXT.includes(extension) || rawType.includes("video")) mediaType = "video";

    const audioOnly = mediaType === "audio";
    const rawQuality = m.quality || m.label || m.resolution || m.height;
    const quality = rawQuality ? String(rawQuality) : "unknown";
    const hasAudio = m.hasAudio !== undefined ? Boolean(m.hasAudio) : !["image", "gif"].includes(mediaType);
    const hasVideo = m.hasVideo !== undefined ? Boolean(m.hasVideo) : ["video"].includes(mediaType);

    return {
      index: i + 1,
      quality,
      resolution: m.height ? `${m.height}p` : m.resolution || quality,
      format: extension.toUpperCase(),
      extension,
      mediaType,
      audioOnly,
      hasVideo,
      hasAudio,
      size: m.size || m.filesize || m.fileSize || null,
      url,
    };
  });
}

function extractSubtitles(raw, options) {
  const subRaw =
    findKey(raw, ["subtitles", "subtitle", "captions", "caption"]) || null;
  const formats = [];
  let available = false;

  const collect = (v) => {
    if (!v) return;
    if (Array.isArray(v)) {
      available = available || v.length > 0;
      for (const item of v) {
        if (typeof item === "string") formats.push(extFromUrl(item) || item);
        else if (item && typeof item === "object") {
          const f = item.lang || item.language || item.format || item.ext ||
            item.label || item.name;
          if (f) formats.push(String(f));
        }
      }
    } else if (typeof v === "object") {
      const keys = Object.keys(v);
      available = available || keys.length > 0;
      formats.push(...keys);
    } else if (typeof v === "string") {
      available = true;
      formats.push(v);
    }
  };
  collect(subRaw);
  for (const o of options) {
    const s = o.subtitles || o.subtitle;
    if (s) collect(s);
  }

  return { available, formats: [...new Set(formats.filter(Boolean))] };
}

async function fetchSite(homeHtml) {
  const $ = cheerio.load(homeHtml);
  const platforms = [];
  $(".slider-item").each((_, el) => {
    const slug = $(el).attr("href") || "";
    const name = ($(el).find("img").attr("alt") || "").trim();
    if (!slug || platforms.find((p) => p.slug === slug)) return;
    platforms.push({
      name: name || slug.replace(/[/-]/g, " ").trim(),
      slug,
      url: new URL(slug, TARGET_URL).toString(),
    });
  });

  const text = $("body").text().replace(/\s+/g, " ").trim();

  const supportedFormats = [];
  for (const f of ["MP4", "MOV", "WEBM", "MP3"]) {
    if (new RegExp("\\b" + f + "\\b", "i").test(text)) supportedFormats.push(f);
  }

  const advertisedResolutions = [];
  for (const r of ["360p", "480p", "720p", "1080p", "1440p", "2K", "4K", "8K"]) {
    if (new RegExp("\\b" + r + "\\b", "i").test(text)) advertisedResolutions.push(r);
  }

  const descriptions = [];
  $("li").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > 20 && t.length < 240 && !/http|jackpot|news|promo|code/i.test(t)) {
      descriptions.push(t);
    }
  });

  const contentSet = new Set(["video", "audio"]);
  for (const p of platforms) {
    const key = Object.keys(PLATFORM_CONTENT).find(
      (k) => k.toLowerCase() === p.name.toLowerCase()
    );
    const caps = PLATFORM_CONTENT[key] || PLATFORM_CONTENT[p.name];
    if (caps) caps.forEach((c) => contentSet.add(c));
  }
  const supportedContentTypes = ALL_CONTENT_TYPES.filter((t) => contentSet.has(t));

  return {
    title: $("title").text().trim(),
    description: ($('meta[name="description"]').attr("content") || "").trim(),
    supportedPlatforms: platforms,
    platformCount: platforms.length,
    supportedFormats,
    advertisedResolutions,
    supportedContentTypes,
    contentTypeSource: "inferensi dari platform yang terdaftar + teks halaman",
    featureHighlights: descriptions.slice(0, 8),
  };
}

async function getHomepage() {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const res = await axios.get(TARGET_URL, {
        timeout: TIMEOUT,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        maxRedirects: 5,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      return res.data;
    } catch (err) {
      lastErr = err;
      log(`[warn] homepage attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_RETRY) await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
  }
  throw lastErr;
}

async function callApi(mediaUrl) {
  const body = new URLSearchParams();
  body.append("url", mediaUrl);
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const res = await axios.post(API_URL, body.toString(), {
        timeout: TIMEOUT,
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json, text/plain, */*",
          Referer: TARGET_URL,
          Origin: new URL(TARGET_URL).origin,
          "X-Requested-With": "XMLHttpRequest",
        },
        maxRedirects: 5,
        validateStatus: (s) => s >= 200 && s < 500,
      });
      return res;
    } catch (err) {
      lastErr = err;
      log(`[warn] api attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_RETRY) await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
  }
  throw lastErr;
}

function emptySite() {
  return {
    title: null,
    description: "",
    supportedPlatforms: [],
    platformCount: 0,
    supportedFormats: [],
    advertisedResolutions: [],
    supportedContentTypes: ALL_CONTENT_TYPES,
    featureHighlights: [],
  };
}

async function scrape(inputUrl, opts) {
  const started = Date.now();
  const result = {
    meta: {
      target: TARGET_URL,
      apiEndpoint: API_URL,
      inputUrl: inputUrl || null,
      scrapedAt: new Date().toISOString(),
      method: "Cheerio (HTML statis) + POST fetch_api.php (JSON)",
      durationMs: 0,
    },
    status: "info",
    progress: 0,
    error: null,
    platform: { name: null, host: null, detected: false },
    contentType: { detected: null, allSiteSupported: ALL_CONTENT_TYPES },
    title: null,
    source: null,
    thumbnail: null,
    mediaUrl: inputUrl || null,
    formats: { available: [], extensions: [] },
    resolutions: [],
    options: [],
    availability: { video: false, audioOnly: false, image: false, gif: false },
    subtitle: { available: false, formats: [] },
    site: emptySite(),
  };

  try {
    log("[1/2] Mengambil halaman target & mendeteksi platform...");
    const html = await getHomepage();
    result.site = await fetchSite(html);
    log(`      ${result.site.platformCount} platform terdeteksi.`);
  } catch (err) {
    result.site = emptySite();
    log(`[warn] gagal mengambil homepage: ${err.message}`);
  }

  if (!inputUrl) {
    result.status = result.site.supportedPlatforms.length ? "info" : "failed";
    if (result.status === "failed") result.error = "Target tidak mengembalikan data platform.";
    result.meta.durationMs = Date.now() - started;
    return result;
  }

  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch {
    result.status = "failed";
    result.error = `URL tidak valid: ${inputUrl}`;
    result.meta.durationMs = Date.now() - started;
    return result;
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    result.status = "failed";
    result.error = "Hanya URL http/https yang didukung.";
    result.meta.durationMs = Date.now() - started;
    return result;
  }

  result.platform = detectPlatform(inputUrl);
  result.contentType.detected = contentTypeFromUrl(inputUrl, result.platform.name);

  log(`[2/2] Memproses URL via fetch_api.php (${result.platform.name || "Unknown"})...`);
  try {
    const res = await callApi(inputUrl);
    const data = typeof res.data === "string" ? safeJson(res.data) : res.data;
    if (opts && opts.raw) result.rawApiResponse = data;

    if (!data || typeof data !== "object") {
      result.status = "failed";
      result.error = "Respons API tidak valid (bukan JSON).";
    } else {
      const apiMsg = data.message || data.error || null;
      const rawMedias = data.medias || data.links || data.data || [];
      const options = normalizeMediaOptions(rawMedias);

      if (data.title) result.title = data.title;
      if (data.source) result.source = data.source;
      else result.source = result.platform.name;
      if (data.thumbnail || data.picture || data.cover) {
        result.thumbnail = data.thumbnail || data.picture || data.cover;
      } else if (data.title === undefined && findKey(data, ["thumbnail", "picture"])) {
        result.thumbnail = findKey(data, ["thumbnail", "picture"]);
      }
      result.options = options;

      const exts = [...new Set(options.map((o) => o.extension))];
      result.formats = { available: exts.map((e) => e.toUpperCase()), extensions: exts };
      result.resolutions = [
        ...new Set(options.map((o) => o.resolution).filter((r) => r && r !== "unknown")),
      ];
      result.availability = {
        video: options.some((o) => o.mediaType === "video"),
        audioOnly: options.some((o) => o.audioOnly),
        image: options.some((o) => o.mediaType === "image"),
        gif: options.some((o) => o.mediaType === "gif"),
      };
      result.subtitle = extractSubtitles(data, options);

      const isError =
        data.status === "error" ||
        (!options.length && (apiMsg || data.status === "error"));

      if (options.length > 0) {
        result.status = "success";
        result.progress = 100;
        result.error = null;
      } else {
        result.status = "failed";
        result.progress = 0;
        result.error = apiMsg || "Tidak ada media yang ditemukan untuk URL ini.";
      }
    }
  } catch (err) {
    result.status = "failed";
    result.progress = 0;
    if (err.code === "ECONNABORTED" || /timeout/i.test(err.message)) {
      result.error = `Timeout setelah ${TIMEOUT}ms pada endpoint fetch_api.php.`;
    } else if (err.response) {
      result.error = `HTTP ${err.response.status}: ${err.response.statusText || "error"}`;
    } else {
      result.error = `Gagal menghubungi API: ${err.message}`;
    }
  }

  result.meta.durationMs = Date.now() - started;
  return result;
}

function safeJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    const m = str.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function parseArgs(argv) {
  const args = { url: null, out: null, raw: false };
  for (const a of argv) {
    if (a === "--raw") args.raw = true;
    else if (a.startsWith("--out=")) args.out = a.slice(6);
    else if (a === "--out") args.out = true;
    else if (!a.startsWith("--") && !args.url) args.url = a;
  }
  if (args.out === true) args.out = "scrape-aio-output.json";
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await scrape(args.url, args);
  const json = JSON.stringify(result, null, 2);

  process.stdout.write(json + "\n");

  if (args.out) {
    const outPath = path.resolve(process.cwd(), args.out);
    fs.writeFileSync(outPath, json, "utf8");
    log(`[ok] hasil disimpan ke ${outPath}`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    process.stdout.write(
      JSON.stringify(
        { status: "failed", error: `Fatal: ${err.message}`, progress: 0 },
        null,
        2
      ) + "\n"
    );
    process.exitCode = 1;
  });
}

module.exports = { scrape, fetchSite, normalizeMediaOptions, detectPlatform };