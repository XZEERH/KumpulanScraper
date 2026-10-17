#!/usr/bin/env node

/**
 * Name : YT Downloader
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://www.snapyt.app/id/
 * Type : Scraper
 * Description : Download video YouTube dan YouTube Shorts melalui eksekusi url. Pengguna dapat memasukkan URL video atau mencari berdasarkan kata kunci, username channel, dan hashtag. Website ini menyediakan pilihan format video MP4/WEBM serta audio MP3/M4A dengan kualitas yang bergantung pada ketersediaan sumber.
 * Note : Pilihan format dan kualitas nya lengkap banget, dari MP4 = Kualitas didapat 114p, 240p, 360p, 480p, 720p, 720p60, 1080p60. Untuk WEBM = 240p, 360p, 480p, 720p, 720p60, 1080p60. Lanjut format audio/MP3 = 128 kbps, 192 kbps, 320 kbps. Sama ada pilihan Audio (M4A) • Indonesian = Opus Audio 56 kbps, 83 kbps, 152 kbps, ada lagi pilihan Audio • English = Opus audio 51 kbps, 82 kbps, 130 kbps, 144 kbps. Scrape ini menggunakan dependensi: axios, cheerio dan hanya kompatibel di Node.js >= 16 (keatas). Btw Link download/stream bersifat sementara jadi token preview kedaluwarsa beberapa jam. Error fix sendiri
 */

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

/* ────────────────────────── konfigurasi ────────────────────────── */

const BASE = "https://www.snapyt.app";
const AJAX = `${BASE}/wp-admin/admin-ajax.php`;
const HOME_ID = `${BASE}/id/`;
const TIMEOUT_MS = 45000;
const RETRIES = 3;

const UA =
  "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

const HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
};

/** Format URL YouTube yang didukung (disalin dari validasi situs). */
const SUPPORTED_URL_PATTERNS = [
  "https://www.youtube.com/watch?v=<VIDEO_ID>",
  "https://youtube.com/watch?v=<VIDEO_ID>",
  "https://youtu.be/<VIDEO_ID>",
  "https://www.youtube.com/shorts/<VIDEO_ID>",
  "https://www.youtube.com/embed/<VIDEO_ID>",
  "https://www.youtube.com/live/<VIDEO_ID>",
  "https://www.youtube.com/v/<VIDEO_ID>",
  "https://www.youtube-nocookie.com/embed/<VIDEO_ID>",
  "(varian http / mobile m.youtube.com / dengan &t= biasanya ikut diterima)",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ────────────────────────── util ────────────────────────── */

function isYouTubeUrl(raw) {
  if (typeof raw !== "string") return false;
  let s = raw.trim();
  if (!s) return false;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    const host = (u.hostname || "").toLowerCase();
    if (host === "youtu.be" && u.pathname.length > 1) return true;
    if (
      /(^|\.)youtube\.com$/.test(host) ||
      /(^|\.)youtube-nocookie\.com$/.test(host) ||
      /(^|\.)m\.youtube\.com$/.test(host)
    ) {
      const p = u.pathname || "";
      if (p === "/watch" && u.searchParams.get("v")) return true;
      if (/^\/(shorts|embed|live|v)\/[^/]+/.test(p)) return true;
    }
  } catch {
    return false;
  }
  return false;
}

function extractVideoId(raw) {
  let s = String(raw || "").trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "").toLowerCase();
    if (host === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] || null;
    const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/);
    if (m) return m[2];
    return u.searchParams.get("v");
  } catch {
    const m = String(raw).match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/|v\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : null;
  }
}

function normalizeYouTubeUrl(raw) {
  const id = extractVideoId(raw);
  if (!id) return String(raw || "").trim();
  return `https://www.youtube.com/watch?v=${id}`;
}

function contentTypeOf(raw) {
  return /\/shorts\//i.test(String(raw || "")) ? "shorts" : "video";
}

function parseDuration(text) {
  // "3:33" | "1:02:03" | "Duration: 3:33"
  const m = String(text || "").match(/(\d{1,2}:)?(\d{1,2}):(\d{2})/);
  if (!m) return { text: null, seconds: null };
  const parts = m[0].split(":").map((n) => parseInt(n, 10));
  let sec = 0;
  for (const p of parts) sec = sec * 60 + p;
  return { text: m[0], seconds: sec };
}

function parseResolution(label) {
  const m = String(label || "").match(/(\d{3,4})p/);
  return m ? `${m[1]}p` : null;
}

function parseBitrateKbps(label) {
  const m = String(label || "").match(/(\d{2,3})\s*kbps/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseSizeToBytes(size) {
  if (!size) return null;
  const m = String(size).match(/([\d.]+)\s*(KB|MB|GB|kB)/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  const mult = unit === "GB" ? 1024 ** 3 : unit === "MB" ? 1024 ** 2 : 1024;
  return Math.round(n * mult);
}

function errResult(input, stage, message, extra = {}) {
  return {
    success: false,
    input,
    status: "error",
    error_stage: stage,
    error_message: message,
    supported_url_formats: SUPPORTED_URL_PATTERNS,
    ...extra,
  };
}

/* ────────────────────────── HTTP ────────────────────────── */

async function httpPostForm(fields, opts = {}) {
  let lastErr = null;
  const body = new URLSearchParams(fields).toString();
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await axios.post(AJAX, body, {
        timeout: TIMEOUT_MS,
        headers: {
          ...HEADERS,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: HOME_ID,
          Origin: BASE,
          "X-Requested-With": "XMLHttpRequest",
          ...(opts.headers || {}),
        },
        validateStatus: (s) => s >= 200 && s < 500,
      });
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < RETRIES) await sleep(1000 * attempt);
    }
  }
  throw new Error(
    `Request ke ${AJAX} gagal: ${lastErr ? lastErr.message : "unknown"}`
  );
}

async function httpGet(url, opts = {}) {
  let lastErr = null;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await axios.get(url, {
        timeout: TIMEOUT_MS,
        headers: { ...HEADERS, ...(opts.headers || {}) },
        maxRedirects: 5,
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return res.data;
    } catch (e) {
      lastErr = e;
      const st = e.response && e.response.status;
      if (st && st >= 400 && st < 500 && st !== 429 && attempt >= 1) {
        // 4xx selain 429: jangan retry terlalu agresif
        if (st === 403 || st === 404 || st === 410) {
          throw new Error(`HTTP ${st} untuk ${url}`);
        }
      }
      if (attempt < RETRIES) await sleep(1200 * attempt);
    }
  }
  const st = lastErr && lastErr.response && lastErr.response.status;
  throw new Error(`Gagal GET ${url}: ${st ? "HTTP " + st : lastErr ? lastErr.message : "unknown"}`);
}

/* ────────────────────────── inti scrape ────────────────────────── */

async function getFreshNonce() {
  const res = await httpPostForm({ action: "vd_fresh_nonce" });
  const j = res.data;
  if (j && j.success && j.data && j.data.nonce) return j.data.nonce;
  // fallback: nonce yang tertanam di halaman home
  const html = await httpGet(HOME_ID);
  const m = html.match(/"nonce"\s*:\s*"([a-f0-9]+)"/);
  if (m) return m[1];
  throw new Error("Nonce tidak ditemukan dari vd_fresh_nonce maupun halaman home.");
}

async function requestPreviewUrl(ytUrl, nonce) {
  const res = await httpPostForm({
    action: "process_video_url",
    video_url: ytUrl,
    security: nonce || "",
  });
  const status = res.status;
  const j = res.data;

  // nonce basi (403 / -1) -> ambil nonce baru, coba sekali lagi
  if ((status === 403 || (j === -1 || j === "-1")) && !requestPreviewUrl._retried) {
    requestPreviewUrl._retried = true;
    const fresh = await getFreshNonce();
    return requestPreviewUrl(ytUrl, fresh);
  }

  if (j && j.success && j.data && j.data.redirect) {
    return { redirect: j.data.redirect, raw: j };
  }
  const msg =
    j && typeof j.data === "string"
      ? j.data
      : j && j.data && j.data.message
        ? j.data.message
        : `Respons tidak valid (HTTP ${status}).`;
  const e = new Error(msg);
  e.apiResponse = j;
  throw e;
}

function parsePreviewHtml(html, inputUrl) {
  const $ = cheerio.load(html);

  const title = $("h1.title").first().text().trim() || null;
  const chip = $(".chip").first().text().replace(/\s+/g, " ").trim() || null;
  const thumbEl = $("img#vd-image").first();
  const thumbnail =
    thumbEl.attr("src") ||
    (($("#vd-thumb-dl").attr("data-srcs") || "").split("|")[0] || "") ||
    null;

  const thumbAlternatives = ($("#vd-thumb-dl").attr("data-srcs") || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  let durationText = null;
  let durationSeconds = null;
  $("div.meta, .meta").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    const m = t.match(/Duration:\s*([0-9:]+)/i);
    if (m && !durationText) {
      durationText = m[1];
      const parsed = parseDuration(m[1]);
      durationSeconds = parsed.seconds;
    }
  });

  let sizeLine = null;
  $("div.meta, .meta").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (/^Size:/i.test(t) && !sizeLine) sizeLine = t.replace(/^Size:\s*/i, "");
  });

  const formats = [];
  $("#fmt-select optgroup").each((_, og) => {
    const groupLabel = $(og).attr("label") || "";
    const groupClean = groupLabel.replace(/^[^\w]*\s*/, "").trim() || groupLabel;
    $(og)
      .find("option")
      .each((__, opt) => {
        const $o = $(opt);
        const label = ($o.attr("data-label") || $o.text()).replace(/\s+/g, " ").trim();
        const text = $o.text().replace(/\s+/g, " ").trim();
        const kind = $o.attr("data-kind") || null;
        const ext = $o.attr("data-ext") || null;
        const size = $o.attr("data-size") || null;
        const bytesAttr = $o.attr("data-bytes");
        const mp3 = $o.attr("data-mp3");
        const force = $o.attr("data-force") || null;
        const stream = $o.attr("data-url") || null;

        let itag = null;
        try {
          if (stream) itag = new URL(stream).searchParams.get("itag");
        } catch {
          /* ignore */
        }

        formats.push({
          group: groupClean,
          value: $o.attr("value") || null,
          label: label || text || null,
          text: text || null,
          kind, // video+audio | video-only | audio-only
          extension: ext || null,
          resolution: parseResolution(label || text),
          bitrate_kbps: mp3 ? parseInt(mp3, 10) : parseBitrateKbps(label || text),
          is_mp3: Boolean(mp3) || /mp3/i.test(label || text),
          size_display: size || null,
          size_bytes: bytesAttr ? parseInt(bytesAttr, 10) : parseSizeToBytes(size),
          recommended: $o.attr("data-recommended") === "1",
          itag,
          download_url: force,
          stream_url: stream, // googlevideo; kedaluwarsa cepat
        });
      });
  });

  const videoId =
    extractVideoId(inputUrl) ||
    (() => {
      const m = (thumbnail || "").match(/\/vi\/([^/]+)\//);
      return m ? m[1] : null;
    })();

  const statusText = ($("#fmt-sub").first().text() || "").trim() || null;
  const errorBox = $("#error-message").text().replace(/\s+/g, " ").trim();

  return {
    video_id: videoId,
    title,
    status_chip: chip,
    status_text: statusText,
    page_error: errorBox || null,
    thumbnail_url: thumbnail,
    thumbnail_alternatives: thumbAlternatives,
    duration_text: durationText,
    duration_seconds: durationSeconds,
    default_size_line: sizeLine,
    formats,
    format_summary: {
      total: formats.length,
      groups: [...new Set(formats.map((f) => f.group))],
      extensions: [...new Set(formats.map((f) => f.extension).filter(Boolean))],
      resolutions: [
        ...new Set(formats.map((f) => f.resolution).filter(Boolean)),
      ],
      has_video_plus_audio: formats.some((f) => f.kind === "video+audio"),
      has_video_only: formats.some((f) => f.kind === "video-only"),
      has_audio_only: formats.some((f) => f.kind === "audio-only"),
      has_mp3: formats.some((f) => f.is_mp3),
      has_m4a: formats.some((f) => f.extension === "m4a"),
      has_webm: formats.some((f) => f.extension === "webm"),
      has_mp4: formats.some((f) => f.extension === "mp4"),
    },
  };
}

async function fetchOEmbed(ytUrl) {
  try {
    const url =
      "https://www.youtube.com/oembed?format=json&url=" +
      encodeURIComponent(normalizeYouTubeUrl(ytUrl));
    const data = await httpGet(url, {
      headers: { Accept: "application/json", Referer: "https://www.youtube.com/" },
    });
    const obj = typeof data === "string" ? JSON.parse(data) : data;
    const channelUrl = obj.author_url || null;
    let username = null;
    if (channelUrl) {
      const m = channelUrl.match(/@([^/?#]+)/);
      username = m ? `@${m[1]}` : null;
    }
    return {
      channel_name: obj.author_name || null,
      channel_username: username,
      channel_url: channelUrl,
      oembed_title: obj.title || null,
      provider: obj.provider_name || null,
    };
  } catch {
    return {
      channel_name: null,
      channel_username: null,
      channel_url: null,
      oembed_title: null,
      provider: null,
      oembed_note: "YouTube oEmbed tidak dapat dihubungi (opsional).",
    };
  }
}

/**
 * Scrape satu URL YouTube via SnapYT.
 * @param {string} inputUrl
 * @param {{ oembed?: boolean, stream?: boolean }} opts
 */
async function scrapeVideo(inputUrl, opts = {}) {
  const useOembed = opts.oembed !== false;
  const keepStream = opts.stream !== false;
  const started = Date.now();

  if (!inputUrl || !String(inputUrl).trim()) {
    return errResult(inputUrl, "validation", "URL kosong.");
  }
  if (!isYouTubeUrl(inputUrl)) {
    return errResult(
      inputUrl,
      "validation",
      "Bukan URL YouTube yang didukung. Tempel link video/Shorts YouTube.",
      { supported_url_formats: SUPPORTED_URL_PATTERNS }
    );
  }

  try {
    const nonce = await getFreshNonce();
    let redirect;
    try {
      ({ redirect } = await requestPreviewUrl(inputUrl, nonce));
    } catch (e1) {
      // nonce kemungkinan basi -> refresh sekali lagi
      const nonce2 = await getFreshNonce();
      requestPreviewUrl._retried = false;
      ({ redirect } = await requestPreviewUrl(inputUrl, nonce2));
    }

    const previewHtml = await httpGet(redirect);
    const parsed = parsePreviewHtml(previewHtml, inputUrl);
    if (!keepStream) {
      for (const f of parsed.formats) f.stream_url = null;
    }

    if (!parsed.formats.length && !parsed.title) {
      return errResult(
        inputUrl,
        "parse",
        "Halaman preview kosong / tidak ada daftar format (video mungkin dihapus, privat, atau diblokir regional).",
        {
          preview_url: redirect,
          page_error: parsed.page_error,
          status_chip: parsed.status_chip,
        }
      );
    }

    const oembed = useOembed ? await fetchOEmbed(inputUrl) : {};

    return {
      success: true,
      status: "ok",
      scraped_at: new Date().toISOString(),
      elapsed_ms: Date.now() - started,
      source: {
        site: "SnapYT",
        base_url: BASE,
        home_url: HOME_ID,
        ajax_url: AJAX,
        preview_url: redirect,
        query_url: redirect, // URL hasil proses pencarian/lookup SnapYT
      },
      input_url: inputUrl,
      video: {
        id: parsed.video_id,
        url: parsed.video_id
          ? `https://www.youtube.com/watch?v=${parsed.video_id}`
          : normalizeYouTubeUrl(inputUrl),
        shorts_url: parsed.video_id
          ? `https://www.youtube.com/shorts/${parsed.video_id}`
          : null,
        content_type: contentTypeOf(inputUrl),
        title: parsed.title,
        description: null, // SnapYT tidak menampilkan deskripsi
        thumbnail_url: parsed.thumbnail_url,
        thumbnail_alternatives: parsed.thumbnail_alternatives,
        duration_text: parsed.duration_text,
        duration_seconds: parsed.duration_seconds,
        views: null, // SnapYT tidak menampilkan jumlah tayangan
        uploaded_at: null, // SnapYT tidak menampilkan tanggal upload
        unavailable_from_snapyt: [
          "description",
          "views",
          "uploaded_at",
        ],
      },
      channel: {
        name: oembed.channel_name || null,
        username: oembed.channel_username || null,
        url: oembed.channel_url || null,
        note: oembed.oembed_note
          || (useOembed
            ? "Nama channel dari YouTube oEmbed (bukan dari SnapYT)."
            : "oembed dinonaktifkan (--no-oembed)."),
      },
      process: {
        status_chip: parsed.status_chip,
        status_text: parsed.status_text,
        page_error: parsed.page_error,
        format_count: parsed.formats.length,
      },
      formats: parsed.formats,
      format_summary: parsed.format_summary,
      default_size_line: parsed.default_size_line,
      supported_url_formats: SUPPORTED_URL_PATTERNS,
      notes: [
        "Link download/stream bersifat sementara (token preview kedaluwarsa beberapa jam).",
        "SnapYT hanya memproses URL video YouTube/Shorts — tidak ada search keyword/channel/hashtag di situs ini.",
        "Deskripsi, views, dan tanggal upload tidak tersedia di SnapYT.",
      ],
    };
  } catch (e) {
    return errResult(inputUrl, "request", e.message || "Unknown error", {
      api_response: e.apiResponse !== undefined ? e.apiResponse : undefined,
    });
  }
}

/* ────────────────────────── CLI ────────────────────────── */

function parseArgs(argv) {
  const args = { urls: [], out: null, oembed: true, pretty: true, file: null, stream: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-o" || a === "--out") args.out = argv[++i];
    else if (a === "--file" || a === "-f") args.file = argv[++i];
    else if (a === "--no-oembed") args.oembed = false;
    else if (a === "--oembed") args.oembed = true;
    else if (a === "--no-stream") args.stream = false;
    else if (a === "--stream") args.stream = true;
    else if (a === "--compact") args.pretty = false;
    else if (a === "--pretty") args.pretty = true;
    else if (a === "-h" || a === "--help") args.help = true;
    else if (!a.startsWith("-")) args.urls.push(a);
  }
  return args;
}

function printHelp() {
  console.log(`SnapYT scraper — https://www.snapyt.app/

Pemakaian:
  node scrape-snapyt.js "<url-youtube>"
  node scrape-snapyt.js "<url1>" "<url2>" ...
  node scrape-snapyt.js --file urls.txt
  node scrape-snapyt.js "<url>" -o hasil.json
  node scrape-snapyt.js "<url>" --no-oembed --compact

Opsi:
  -o, --out <file>   Simpan JSON ke file (juga tetap ringkas ke stdout)
  -f, --file <file>  Baca daftar URL (satu per baris, # = komentar)
  --no-oembed        Lewati enrich channel via YouTube oembed
  --no-stream        Sembunyikan stream_url googlevideo (output lebih ringkas)
  --compact          JSON satu baris
  --pretty           JSON rapi (default)
  -h, --help         Bantuan

Contoh URL yang didukung:
  https://www.youtube.com/watch?v=dQw4w9WgXcQ
  https://youtu.be/dQw4w9WgXcQ
  https://www.youtube.com/shorts/jNQXAC9IVRw
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (args.urls.length === 0 && !args.file)) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  let urls = [...args.urls];
  if (args.file) {
    const txt = fs.readFileSync(args.file, "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const t = line.trim();
      if (t && !t.startsWith("#")) urls.push(t);
    }
  }
  urls = urls.filter(Boolean);

  if (!urls.length) {
    console.error("Tidak ada URL untuk diproses.");
    process.exit(1);
  }

  const results = [];
  for (const u of urls) {
    process.stderr.write(`[scrape] ${u} ... `);
    const r = await scrapeVideo(u, { oembed: args.oembed, stream: args.stream });
    process.stderr.write(r.success ? `OK (${r.formats.length} format)\n` : `GAGAL: ${r.error_message}\n`);
    results.push(r);
    if (urls.length > 1) await sleep(800); // jeda antar URL
  }

  const payload =
    results.length === 1
      ? results[0]
      : {
          success_count: results.filter((r) => r.success).length,
          error_count: results.filter((r) => !r.success).length,
          results,
        };

  const json = args.pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
  console.log(json);

  if (args.out) {
    fs.writeFileSync(args.out, json + "\n", "utf8");
    process.stderr.write(`[simpan] ${path.resolve(args.out)}\n`);
  }

  process.exit(results.some((r) => r.success) ? 0 : 2);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("Fatal:", e.message || e);
    process.exit(3);
  });
}

module.exports = { scrapeVideo, isYouTubeUrl, extractVideoId, SUPPORTED_URL_PATTERNS };