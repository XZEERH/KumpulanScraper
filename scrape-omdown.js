#!/usr/bin/env node
"use strict";

/**
 * Name : omdown.site scraper (support link download 26+ platform)
 * Owner : Razeerh
 * SL : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web : https://www.omdown.site
 * Type : Scraper
 * Func: resolve <url> → info media + link download (mp4/mp3/gambar) dengan kualitas terbaik.
 * Note: error fix sendiri.
 */

const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://www.omdown.site";
const UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

// ID server action hasil observasi (Node 12 Okt 2026).
const FALLBACK_ACTIONS = {
  session: "40010ff24080496480300f210c602eff421bbabc68",
  resolve: "702804ccc82147179e70c99569473492d22dd96950",
};

// Server menolak panggilan yang tidak berasal dari konteks browser
// ("Panggilan langsung tidak diizinkan") -> header sec-fetch wajib ada.
const COMMON_HEADERS = {
  "User-Agent": UA,
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "sec-ch-ua": '"Chromium";v="120", "Not:A-Brand";v="24"',
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": '"Android"',
};

const SEC_FETCH_HEADERS = {
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
  "sec-fetch-user": "?1",
};

// Daftar platform (regex host -> nama yang dipakai server).
const PLATFORMS = [
  [/(?:^|\.)shortdrama\.tiktok\.com$/i, "PineDrama"],
  [/(?:^|\.)tiktok\.com$/i, "TikTok"],
  [/(?:^|\.)(?:douyin\.com|iesdouyin\.com)$/i, "Douyin"],
  [/(?:^|\.)(?:kuaishou\.com|kwai\.com)$/i, "Kuaishou"],
  [/(?:^|\.)(?:snackvideo\.com|sck\.io)$/i, "SnackVideo"],
  [/(?:^|\.)(?:xiaohongshu\.com|rednote\.com|xhslink\.com)$/i, "RedNote"],
  [/(?:^|\.)(?:youtu\.be|youtube\.com)$/i, "YouTube"],
  [/(?:^|\.)(?:instagram\.com|instagr\.am|ig\.me)$/i, "Instagram"],
  [/(?:^|\.)(?:twitter\.com|x\.com|t\.co)$/i, "X"],
  [/(?:^|\.)(?:facebook\.com|fb\.watch|fb\.com)$/i, "Facebook"],
  [/(?:^|\.)threads\.(?:net|com)$/i, "Threads"],
  [/(?:^|\.)(?:bsky\.app|bsky\.social)$/i, "Bluesky"],
  [/(?:^|\.)(?:reddit\.com|redd\.it)$/i, "Reddit"],
  [/(?:^|\.)capcut\.com$/i, "CapCut"],
  [/(?:^|\.)snapchat\.com$/i, "Snapchat"],
  [/(?:^|\.)twitch\.tv$/i, "Twitch"],
  [/(?:^|\.)(?:bilibili\.com|bilibili\.tv|b23\.tv|bili\.im)$/i, "Bilibili"],
  [/(?:^|\.)(?:dailymotion\.com|dai\.ly)$/i, "Dailymotion"],
  [/(?:^|\.)lahelu\.com$/i, "Lahelu"],
  [/(?:^|\.)(?:spotify\.com|spoti\.fi)$/i, "Spotify"],
  [/(?:^|\.)soundcloud\.com$/i, "SoundCloud"],
  [/(?:^|\.)(?:music\.apple\.com|apple\.co)$/i, "Apple Music"],
  [/(?:^|\.)(?:pinterest\.(?:com|co\.[a-z]{2}|[a-z]{2,3})|pin\.it)$/i, "Pinterest"],
  [/(?:^|\.)deviantart\.com$/i, "DeviantArt"],
  [/(?:^|\.)pixiv\.net$/i, "Pixiv"],
  [/(?:^|\.)mangadex\.org$/i, "MangaDex"],
  [/(?:^|\.)imgur\.com$/i, "Imgur"],
];

/* ------------------------------------------------------------------ */
/* util                                                                */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function nowIso() {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* HTTP client + cookie jar                                            */
/* ------------------------------------------------------------------ */

const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(res) {
  const sc = res.headers && res.headers["set-cookie"];
  if (!sc) return;
  const arr = Array.isArray(sc) ? sc : [sc];
  for (const c of arr) {
    const pair = String(c).split(";")[0];
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}

const client = axios.create({
  timeout: 30000,
  maxRedirects: 5,
  decompress: true,
  validateStatus: () => true,
  transformResponse: [(d) => d],
});

async function request(config) {
  const headers = { ...(config.headers || {}) };
  if (jar.size) headers.Cookie = cookieHeader();
  const res = await client.request({ ...config, headers });
  storeCookies(res);
  return res;
}

/* ------------------------------------------------------------------ */
/* tanda tangan payload (replika bundle klien)                         */
/* ------------------------------------------------------------------ */

function fnv(e) {
  let a = 0x811c9dc5,
    n = 0x9e3779b9,
    t = 0x7fffffff,
    o = 0x27d4eb2d;
  for (let i = 0; i < e.length; i++) {
    const l = e.charCodeAt(i);
    a = Math.imul(a ^ l, 0x1000193);
    n = Math.imul(n ^ (l >>> 2), 0x85ebca6b);
    t = Math.imul(t ^ ((l << 3) & 255), 0xc2b2ae35);
    o = Math.imul(o ^ l, 0x165667b1);
  }
  const r = (x) => (x >>> 0).toString(16).padStart(8, "0");
  return r(a) + r(n) + r(t) + r(o) + r(a ^ t) + r(n ^ o) + r(a + n) + r(t + o);
}

function deriveKey(timestamp, salt) {
  const s = fnv(`${(23100 ^ timestamp) >>> 0}:${salt}:${timestamp % 997}`);
  const key = [];
  for (let i = 0; i < s.length; i += 2) key.push(parseInt(s.slice(i, i + 2), 16));
  return key;
}

function base64url(bytes) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signPayload(url, platform, locale, salt) {
  const t = Date.now();
  const n = Math.floor(1e9 * Math.random()).toString(36);
  const plaintext = JSON.stringify({
    u: url.trim(),
    p: platform || "Media",
    l: locale || "id",
    t,
    n,
  });
  const key = deriveKey(t, salt);
  const enc = new TextEncoder().encode(plaintext);
  const x = new Uint8Array(enc.length);
  for (let i = 0; i < enc.length; i++) x[i] = enc[i] ^ key[i % key.length];
  const data = base64url(x);
  const h = fnv(`${data}:${t}:${salt}`);
  return { data, t, h };
}

/* ------------------------------------------------------------------ */
/* parser React Flight (RSC)                                           */
/* ------------------------------------------------------------------ */

function parseFlight(text) {
  const chunks = {};
  let i = 0;
  while (i < text.length) {
    const j = text.indexOf(":", i);
    if (j < 0) break;
    const id = text.slice(i, j);
    if (id === "") {
      const nl = text.indexOf("\n", j + 1);
      i = nl < 0 ? text.length : nl + 1;
      continue;
    }
    const tag = text[j + 1];
    if (tag === "T") {
      const comma = text.indexOf(",", j + 2);
      const len = parseInt(text.slice(j + 2, comma), 16);
      chunks[id] = text.slice(comma + 1, comma + 1 + len);
      i = comma + 1 + len;
      if (text[i] === "\n") i++;
    } else {
      const nl = text.indexOf("\n", j + 1);
      chunks[id] = text.slice(j + 1, nl < 0 ? text.length : nl);
      i = nl < 0 ? text.length : nl + 1;
    }
  }
  return chunks;
}

function resolveFlightValue(v, chunks) {
  if (typeof v === "string") {
    if (v === "$undefined") return undefined;
    if (v[0] === "$") {
      if (v[1] === "$") return v.slice(1);
      const id = v[1] === "@" ? v.slice(2) : v.slice(1);
      if (Object.prototype.hasOwnProperty.call(chunks, id)) {
        return resolveFlightValue(chunks[id], chunks);
      }
      return v;
    }
    return v;
  }
  if (Array.isArray(v)) return v.map((x) => resolveFlightValue(x, chunks));
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v)) out[k] = resolveFlightValue(v[k], chunks);
    return out;
  }
  return v;
}

function extractActionResult(text) {
  const chunks = parseFlight(text);
  if (!("1" in chunks)) return null;
  let v = chunks["1"];
  if (typeof v === "string") {
    const start = v.indexOf("{");
    if (start < 0) return null;
    try {
      v = JSON.parse(v.slice(start));
    } catch {
      return null;
    }
  }
  return resolveFlightValue(v, chunks);
}

/* ------------------------------------------------------------------ */
/* pemanggilan server action                                           */
/* ------------------------------------------------------------------ */

function actionHeaders(actionId) {
  return {
    ...COMMON_HEADERS,
    ...SEC_FETCH_HEADERS,
    Accept: "text/x-component",
    "Next-Action": actionId,
    "Content-Type": "text/plain;charset=UTF-8",
    Origin: BASE,
    Referer: BASE + "/",
  };
}

async function callAction(actionId, args) {
  const res = await request({
    method: "POST",
    url: BASE + "/",
    headers: actionHeaders(actionId),
    data: JSON.stringify(args),
  });
  return { status: res.status, headers: res.headers, result: extractActionResult(res.data) };
}

/* ------------------------------------------------------------------ */
/* penemuan ID server action (fallback bila ID lama tidak berlaku)     */
/* ------------------------------------------------------------------ */

async function discoverActions() {
  const found = {};
  const home = await request({ method: "GET", url: BASE + "/", headers: { ...COMMON_HEADERS } });
  const $ = cheerio.load(home.data);
  const srcs = $("script[src]")
    .map((_, el) => $(el).attr("src"))
    .get()
    .filter((s) => s && s.startsWith("/_next/"));
  for (const src of srcs) {
    let js;
    try {
      const r = await request({ method: "GET", url: BASE + src, headers: { ...COMMON_HEADERS } });
      js = r.data;
    } catch {
      continue;
    }
    const re = /createServerReference\)\("([0-9a-f]{20,})"[\s\S]{0,200}?"(activateSessionAction|resolveMediaAction)"\)/g;
    let m;
    while ((m = re.exec(js))) {
      if (m[2] === "activateSessionAction") found.session = m[1];
      if (m[2] === "resolveMediaAction") found.resolve = m[1];
    }
    if (found.session && found.resolve) break;
  }
  return found;
}

/* ------------------------------------------------------------------ */
/* alur utama                                                          */
/* ------------------------------------------------------------------ */

function detectPlatform(raw) {
  const trimmed = String(raw || "").trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
  let u;
  try {
    u = new URL(candidate);
  } catch {
    return { ok: false, reason: "URL tidak valid." };
  }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) {
    return { ok: false, reason: "URL tidak valid." };
  }
  const hit = PLATFORMS.find(([re]) => re.test(u.hostname));
  return {
    ok: true,
    url: u.toString(),
    platform: hit ? hit[1] : null,
  };
}

async function activateSession(actions) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { headers, result } = await callAction(actions.session, [
      { trusted: true, clientTime: Date.now(), interactionType: "resolve" },
    ]);
    if (headers && headers["x-nextjs-action-not-found"]) {
      throw new Error("ACTION_NOT_FOUND");
    }
    if (result && result.success && result.salt) return result.salt;
    const err = (result && result.error) || "";
    if (/terlalu cepat/i.test(err)) {
      await sleep(1200);
      continue;
    }
    throw new Error(err || "Gagal aktivasi sesi.");
  }
  throw new Error("Gagal aktivasi sesi setelah beberapa percobaan.");
}

async function resolveMedia(actions, rawUrl, platform, locale) {
  await sleep(1500);
  const salt = await activateSession(actions);
  const payload = signPayload(rawUrl, platform, locale, salt);

  for (let attempt = 0; attempt < 3; attempt++) {
    const { headers, result } = await callAction(actions.resolve, [payload, platform, locale]);
    if (headers && headers["x-nextjs-action-not-found"]) {
      throw new Error("ACTION_NOT_FOUND");
    }
    if (result && result.success) return result.data;
    const err = (result && result.error) || "";
    if (/belum diaktivasi|mohon tunggu|terlalu cepat/i.test(err)) {
      await sleep(1500);
      const salt2 = await activateSession(actions);
      Object.assign(payload, signPayload(rawUrl, platform, locale, salt2));
      continue;
    }
    throw new Error(err || "Gagal mengambil data media.");
  }
  throw new Error("Gagal mengambil data media setelah beberapa percobaan.");
}

function absolute(url) {
  if (!url || typeof url !== "string") return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return BASE + url;
  return url;
}

function qualityScore(fmt) {
  const s = `${fmt.quality || ""} ${fmt.label || ""} ${fmt.id || ""}`.toLowerCase();
  if (/4k|2160/.test(s)) return 2160;
  if (/2k|1440/.test(s)) return 1440;
  let q = 0;
  const p = s.match(/(\d{3,4})\s*p\b/);
  if (p) q = parseInt(p[1], 10);
  else if (/original|hd|asli|terbaik|highest/.test(s)) q = 1080;
  if (fmt.kind === "audio") {
    const k = s.match(/(\d{2,3})\s*kbps/);
    q = k ? parseInt(k[1], 10) : q || 128;
  }
  return q;
}

function buildResult(data, meta) {
  const formats = (data.formats || []).map((f) => {
    const isArchive = f.downloadUrl === "all-playlist" || f.downloadUrl === "all-slides";
    return {
      id: f.id,
      label: f.label,
      description: f.description,
      kind: f.kind,
      quality: f.quality,
      ext: f.ext || null,
      hasWatermark: typeof f.hasWatermark === "boolean" ? f.hasWatermark : null,
      sizeLabel: f.sizeLabel || null,
      isArchive,
      downloadUrl: isArchive ? null : absolute(f.downloadUrl),
    };
  });

  const pickBest = (kind) => {
    const list = formats.filter((f) => f.kind === kind && f.downloadUrl);
    if (!list.length) return null;
    return list.reduce((best, cur) =>
      qualityScore(cur) > qualityScore(best) ? cur : best
    );
  };

  const best = {
    video: pickBest("video"),
    audio: pickBest("audio"),
    image: pickBest("image"),
  };

  const slides = (data.slides || []).map((s) => ({
    index: s.index,
    type: s.type,
    downloadUrl: absolute(s.downloadUrl),
  }));

  return {
    success: true,
    source: BASE,
    scrapedAt: nowIso(),
    url: meta.url,
    platform: meta.platform || data.platform || null,
    title: data.title || null,
    author: data.author || null,
    authorAvatar: absolute(data.authorAvatar) || null,
    duration: data.durationLabel || null,
    thumbnail: absolute(data.thumbnailUrl) || null,
    isCarousel: !!data.isCarousel,
    stats: data.stats || null,
    music: data.music
      ? {
          title: data.music.title,
          author: data.music.author,
          duration: data.music.duration,
          playUrl: absolute(data.music.playUrl),
        }
      : null,
    best: {
      video: best.video,
      audio: best.audio,
      image: best.image,
    },
    formats,
    slides,
  };
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const out = { url: null, locale: "id", platform: null, bestOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--locale" || a === "-l") out.locale = argv[++i];
    else if (a === "--platform" || a === "-p") out.platform = argv[++i];
    else if (a === "--best" || a === "-b") out.bestOnly = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (!out.url) out.url = a;
  }
  return out;
}

function usage() {
  return [
    "omdown.site scraper",
    "",
    "Penggunaan:",
    '  node index.js "<url-media>" [opsi]',
    "",
    "Opsi:",
    "  -l, --locale <id|en>   Bahasa label hasil (default: id)",
    "  -p, --platform <nama>  Paksa nama platform (default: deteksi otomatis)",
    "  -b, --best             Tampilkan hanya format kualitas terbaik",
    "  -h, --help             Tampilkan bantuan ini",
    "",
    "Contoh:",
    '  node index.js "https://www.tiktok.com/@user/video/123456"',
    '  node index.js "https://youtu.be/xxxxxxxxxxx" --best > best.json',
    "",
    "Didukung: TikTok, YouTube, Instagram, X, Facebook, Spotify, SoundCloud,",
    "Pinterest, CapCut, Snapchat, DeviantArt, MangaDex, Pixiv, Twitch,",
    "Threads, Reddit, PineDrama, dan lainnya.",
  ].join("\n");
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url) {
    process.stdout.write(usage() + "\n");
    process.exit(args.help ? 0 : 1);
  }

  let actions = { ...FALLBACK_ACTIONS };
  let meta;

  try {
    // 1. deteksi platform lebih dulu (gagal cepat tanpa request jaringan)
    const det = detectPlatform(args.url);
    if (!det.ok) throw new Error(det.reason);
    if (!det.platform && !args.platform) {
      throw new Error(
        "Platform tidak dikenali. Sertakan --platform <nama> atau pakai tautan yang didukung."
      );
    }
    meta = { url: det.url, platform: args.platform || det.platform };

    // 2. ambil halaman untuk menanam cookie sesi
    await request({ method: "GET", url: BASE + "/", headers: { ...COMMON_HEADERS } });

    // 3. resolve (tunggu agar lolos cek kecepatan interaksi server)
    await sleep(2200);
    let data;
    try {
      data = await resolveMedia(actions, meta.url, meta.platform, args.locale);
    } catch (e) {
      if (e.message !== "ACTION_NOT_FOUND") throw e;
      // ID server action berubah -> cari ulang dari bundle JS
      const discovered = await discoverActions();
      actions = { ...actions, ...discovered };
      const salt = await activateSession(actions);
      const payload = signPayload(meta.url, meta.platform, args.locale, salt);
      const res = await callAction(actions.resolve, [payload, meta.platform, args.locale]);
      if (!res.result || !res.result.success) {
        throw new Error((res.result && res.result.error) || "Gagal setelah penemuan ulang action.");
      }
      data = res.result.data;
    }

    const output = buildResult(data, meta);
    if (args.bestOnly) {
      process.stdout.write(
        JSON.stringify(
          {
            success: true,
            source: output.source,
            scrapedAt: output.scrapedAt,
            url: output.url,
            platform: output.platform,
            title: output.title,
            best: output.best,
          },
          null,
          2
        ) + "\n"
      );
    } else {
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    }
  } catch (err) {
    process.stdout.write(
      JSON.stringify(
        {
          success: false,
          source: BASE,
          scrapedAt: nowIso(),
          url: args.url,
          error: err.code === "ECONNABORTED" ? "Request timeout." : err.message,
        },
        null,
        2
      ) + "\n"
    );
    process.exit(2);
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  detectPlatform,
  signPayload,
  parseFlight,
  extractActionResult,
  buildResult,
  resolveMedia,
  discoverActions,
};