"use strict";

/**
 * Name : Pinterest search
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://www.pinterest.com
 * Type : CJS
 * Description : Lengkap banget jir dari gambar, video dan gif, gw udah tes dari untuk gambar result nya sampai 50 (bisa disesuaikan), kalo video sampai 5, kalo gif udah gw coba tapi result nya 0, mungkin pencarian gif gk ada ya wkwk.
 * Note : error fix sendiri
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BASE = "https://www.pinterest.com";
const RESOURCE = `${BASE}/resource/BaseSearchResource/get/`;
const PWS_HANDLER = "www/search/[scope].js";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseArgs(argv) {
  const opts = {
    query: null,
    limit: 50,
    pages: 10,
    pageSize: 25,
    type: "all",
    output: null,
    stdout: false,
    timeout: 20000,
    retries: 3,
    delay: 1200,
    maxRetries: 3,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--query" || a === "-q") opts.query = next();
    else if (a === "--limit" || a === "-l") opts.limit = parseInt(next(), 10);
    else if (a === "--pages" || a === "-p") opts.pages = parseInt(next(), 10);
    else if (a === "--page-size") opts.pageSize = parseInt(next(), 10);
    else if (a === "--type" || a === "-t") opts.type = next();
    else if (a === "--output" || a === "-o") opts.output = next();
    else if (a === "--timeout") opts.timeout = parseInt(next(), 10);
    else if (a === "--retries") opts.retries = parseInt(next(), 10);
    else if (a === "--delay") opts.delay = parseInt(next(), 10);
    else if (a === "--stdout") opts.stdout = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else if (!a.startsWith("-")) positional.push(a);
  }
  if (!opts.query && positional.length) opts.query = positional.join(" ");
  return opts;
}

function printHelp() {
  console.log(`Cara pakai:
  node scrape-pinterestsearch.js "<kata kunci>" [opsi]

Opsi:
  -q, --query <teks>     Kata kunci pencarian
  -l, --limit <n>        Maksimum hasil (default 50)
  -p, --pages <n>        Maksimum halaman (default 10)
      --page-size <n>    Jumlah per halaman (default 25)
  -t, --type <jenis>     Filter media: all | foto | video | gif (default all)
  -o, --output <file>    Path file JSON keluaran
      --stdout           Tampilkan JSON ke terminal
      --timeout <ms>     Timeout request (default 20000)
      --retries <n>      Percobaan ulang request (default 3)
      --delay <ms>       Jeda antar halaman (default 1200)

Contoh:
  node scrape-pinterestsearch.js "nature" --limit 40 --type video -o out.json`);
}

function classifyMedia(pin) {
  if (pin.videos && pin.videos.video_list) return "video";
  const orig = pin.images && pin.images.orig && pin.images.orig.url;
  const xl = pin.image_xlarge_url;
  const candidate = orig || xl || (pin.images && pin.images["736x"] && pin.images["736x"].url) || "";
  if (/\.gif(\?|$)/i.test(candidate)) return "gif";
  return "foto";
}

function pickImage(pin) {
  const imgs = pin.images || {};
  const orig = imgs.orig;
  const large = imgs["736x"] || imgs["564x"] || imgs["474x"] || imgs["236x"];
  const thumb = imgs["236x"] || imgs["170x"] || large || orig;
  return { orig, large, thumb };
}

function pickVideo(pin) {
  const list = pin.videos && pin.videos.video_list;
  if (!list) return null;
  const preferred = ["V_720P", "V_EXP7", "V_480P", "V_HLSV4", "V_HLSV3_MOBILE"];
  let best = null;
  for (const key of preferred) {
    if (list[key]) {
      best = { key, ...list[key] };
      break;
    }
  }
  if (!best) {
    const firstKey = Object.keys(list)[0];
    if (firstKey) best = { key: firstKey, ...list[firstKey] };
  }
  const variants = Object.keys(list).map((k) => ({
    kualitas: k,
    url: list[k].url,
    lebar: list[k].width,
    tinggi: list[k].height,
    durasi_ms: list[k].duration,
    thumbnail: list[k].thumbnail,
  }));
  return { best, variants };
}

function extFromUrl(url) {
  if (!url) return null;
  const clean = url.split("?")[0];
  const m = clean.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : null;
}

function mapPin(pin, index, query, pageNumber, bookmark, seen) {
  const { orig, large, thumb } = pickImage(pin);
  const media = classifyMedia(pin);
  const video = pickVideo(pin);
  const base = orig || large || thumb || {};
  const width = base.width || null;
  const height = base.height || null;

  let mediaUrl = null;
  if (media === "video" && video && video.best) mediaUrl = video.best.url;
  else if (base.url) mediaUrl = base.url;

  const thumbUrl = (thumb && thumb.url) || (video && video.best && video.best.thumbnail) || null;
  const thumbW = (thumb && thumb.width) || null;
  const thumbH = (thumb && thumb.height) || null;

  const pinner = pin.pinner || {};
  const board = pin.board || {};

  const saves =
    (pin.reaction_counts && (pin.reaction_counts["1"] || pin.reaction_counts[1])) ||
    (pin.aggregated_pin_data &&
      pin.aggregated_pin_data.aggregated_stats &&
      pin.aggregated_pin_data.aggregated_stats.saves) ||
    0;
  const comments =
    pin.comment_count ||
    (pin.aggregated_pin_data &&
      pin.aggregated_pin_data.aggregated_stats &&
      pin.aggregated_pin_data.aggregated_stats.comments) ||
    0;

  const id = String(pin.id);
  const duplicate = seen.has(id);
  seen.add(id);

  const format = media === "video" ? extFromUrl(mediaUrl) : extFromUrl(base.url);

  return {
    kata_kunci: query,
    pin_id: id,
    judul: pin.title || pin.grid_title || "",
    deskripsi: pin.description || "",
    alt_text: pin.auto_alt_text || pin.seo_alt_text || null,
    jenis_media: media,
    is_story_pin: Boolean(pin.story_pin_data),
    url_pin: `${BASE}/pin/${id}/`,
    url_thumbnail: thumbUrl,
    thumbnail_resolusi: thumbW && thumbH ? { lebar: thumbW, tinggi: thumbH } : null,
    url_media_asli: mediaUrl,
    resolusi: width && height ? { lebar: width, tinggi: height } : null,
    rasio: width && height ? Number((width / height).toFixed(4)) : null,
    durasi_video_ms: video && video.best ? video.best.duration || null : null,
    durasi_video_detik:
      video && video.best && video.best.duration
        ? Number((video.best.duration / 1000).toFixed(3))
        : null,
    format_media: format,
    gif_format: media === "gif" ? format || "gif" : null,
    gif_animasi: media === "gif" ? true : null,
    video_variants: video ? video.variants : null,
    kreator: {
      nama: pinner.full_name || null,
      username: pinner.username || null,
      url_profil: pinner.username ? `${BASE}/${pinner.username}/` : null,
      avatar: pinner.image_medium_url || pinner.image_small_url || null,
    },
    board: {
      nama: board.name || null,
      id: board.id || null,
      url: board.url ? `${BASE}${board.url}` : null,
      jumlah_pin: board.pin_count != null ? board.pin_count : null,
    },
    domain_sumber: pin.domain || null,
    url_sumber_asli: pin.link || null,
    interaksi: {
      simpan: saves || 0,
      komentar: comments || 0,
    },
    urutan: index,
    halaman: pageNumber,
    cursor_bookmark: bookmark || null,
    duplikat: duplicate,
  };
}

async function bootstrapSession(timeout) {
  const res = await axios.get(`${BASE}/search/pins/`, {
    params: { q: "nature" },
    timeout,
    maxRedirects: 5,
    validateStatus: () => true,
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
  });
  const raw = res.headers["set-cookie"] || [];
  const jar = {};
  for (const line of raw) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  const csrf = jar.csrftoken;
  if (!csrf) throw new Error("Gagal mendapatkan csrftoken dari Pinterest");
  const cookie = Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  return { csrf, cookie };
}

function buildHeaders(session, query) {
  return {
    "User-Agent": UA,
    Accept: "application/json, text/javascript, */*, q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
    "X-Pinterest-AppState": "active",
    "X-Pinterest-PWS-Handler": PWS_HANDLER,
    "X-Pinterest-Source-Url": `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`,
    "x-csrftoken": session.csrf,
    Referer: `${BASE}/search/pins/?q=${encodeURIComponent(query)}`,
    Cookie: session.cookie,
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry(fn, retries, baseDelay, label) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const wait = baseDelay * Math.pow(2, attempt);
        console.error(`  ! ${label} gagal (${err.message}). Coba lagi ${attempt + 1}/${retries} dalam ${wait}ms...`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

async function fetchPage(session, query, bookmark, opts) {
  const options = {
    query,
    scope: "pins",
    rs: "typed",
    page_size: opts.pageSize,
    enable_promoted_pins: false,
  };
  if (bookmark) options.bookmarks = [bookmark];
  const data = JSON.stringify({ options, context: {} });

  return withRetry(
    async () => {
      const res = await axios.get(RESOURCE, {
        params: { source_url: `/search/pins/?q=${query}&rs=typed`, data, _: Date.now() },
        timeout: opts.timeout,
        validateStatus: () => true,
        headers: buildHeaders(session, query),
      });
      if (res.status !== 200) {
        const msg = typeof res.data === "string" ? res.data.slice(0, 200) : JSON.stringify(res.data).slice(0, 200);
        throw new Error(`HTTP ${res.status}: ${msg}`);
      }
      const body = res.data;
      if (!body || !body.resource_response) throw new Error("Respons tidak berisi resource_response");
      const rr = body.resource_response;
      if (rr.status === "failure") {
        const m = rr.error ? rr.error.message : rr.message;
        throw new Error(`API error: ${m}`);
      }
      return rr;
    },
    opts.retries,
    1500,
    "Request"
  );
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.query) {
    printHelp();
    process.exit(opts.query ? 0 : 1);
  }

  const wanted = new Set(["all", "foto", "video", "gif"]);
  if (!wanted.has(opts.type)) {
    console.error(`Filter jenis media tidak dikenal: ${opts.type}. Gunakan all|foto|video|gif.`);
    process.exit(1);
  }

  console.log(`Pinterest Search Scraper`);
  console.log(`Kata kunci : ${opts.query}`);
  console.log(`Filter     : ${opts.type}`);
  console.log(`Limit      : ${opts.limit}`);
  console.log(`Mulai bootstrap sesi...`);

  let session = await bootstrapSession(opts.timeout);
  console.log(`Sesi siap (csrftoken ${session.csrf.slice(0, 8)}...)`);

  const collected = [];
  const seen = new Set();
  let bookmark = null;
  let page = 0;
  let lastBookmark = null;
  let duplicates = 0;

  while (page < opts.pages && collected.length < opts.limit) {
    page++;
    if (page > 1) await sleep(opts.delay);
    process.stdout.write(`Mengambil halaman ${page}... `);

    let rr;
    try {
      rr = await fetchPage(session, opts.query, bookmark, opts);
    } catch (err) {
      if (/HTTP 403|Invalid Resource Request|failure/i.test(err.message)) {
        console.log("\n  Sesi kedaluwarsa, bootstrap ulang...");
        session = await bootstrapSession(opts.timeout);
        try {
          rr = await fetchPage(session, opts.query, bookmark, opts);
        } catch (err2) {
          console.error(`  Gagal: ${err2.message}. Hentikan pagination.`);
          break;
        }
      } else {
        console.error(`  Gagal: ${err.message}. Hentikan pagination.`);
        break;
      }
    }

    const results = (rr.data && rr.data.results) || [];
    console.log(`${results.length} item`);

    if (!results.length) break;

    let addedThisPage = 0;
    for (const raw of results) {
      if (raw.type !== "pin") continue;
      if (collected.length >= opts.limit) break;
      const mapped = mapPin(raw, collected.length + 1, opts.query, page, bookmark, seen);
      if (mapped.duplikat) duplicates++;
      if (opts.type !== "all" && mapped.jenis_media !== opts.type) continue;
      collected.push(mapped);
      addedThisPage++;
    }

    lastBookmark = rr.bookmark || null;
    if (!lastBookmark) {
      console.log("Tidak ada cursor lagi, selesai.");
      break;
    }
    bookmark = lastBookmark;
  }

  const output = {
    meta: {
      kata_kunci: opts.query,
      sumber: `${BASE}/search/pins/?q=${encodeURIComponent(opts.query)}`,
      metode: "Pinterest internal resource API (BaseSearchResource) via HTTP JSON",
      waktu_scrape: new Date().toISOString(),
      filter_media: opts.type,
      batas_limit: opts.limit,
      halaman_diambil: page,
      jumlah_hasil: collected.length,
      jumlah_duplikat: duplicates,
      cursor_terakhir: lastBookmark,
    },
    hasil: collected,
  };

  const json = JSON.stringify(output, null, 2);
  const outPath =
    opts.output ||
    path.join(process.cwd(), `pinterest-${opts.query.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}-${Date.now()}.json`);
  fs.writeFileSync(outPath, json, "utf8");

  if (opts.stdout) console.log(json);
  console.log(`\nSelesai. ${collected.length} hasil (${duplicates} duplikat) -> ${outPath}`);
}

run().catch((err) => {
  console.error(`Error fatal: ${err.message}`);
  process.exit(1);
});