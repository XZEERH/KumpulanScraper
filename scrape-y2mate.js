#!/usr/bin/env node

/**
 * Name : Converter YT mp3/mp4
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://y2mate.gs
 * Type : Scraper
 * Description : Pengonversi video,shorts YouTube menjadi file MP3 (audio) dan MP4 (video) secara online dengan cara memasukkan URL video, shorts lalu memilih format, kemudian memproses dan mengunduh hasilnya.
 * Note : error fix sendiri
 */

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://y2mate.gs";
const TIMEOUT = 20000;
const RETRIES = 3;
const PROGRESS_POLL_MS = 3000;
const PROGRESS_MAX_TRIES = 25;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  Accept: "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: BASE_URL,
  Referer: BASE_URL + "/",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b64 = (s) => Buffer.from(s, "base64").toString("binary");

async function fetchText(url, opts = {}) {
  let lastErr = null;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await axios.get(url, {
        timeout: TIMEOUT,
        headers: { ...BROWSER_HEADERS, ...(opts.headers || {}) },
        responseType: opts.responseType || "text",
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return res.data;
    } catch (err) {
      lastErr = err;
      const status = err.response ? err.response.status : null;
      if (status === 429) {
        const wait = Math.min(2000 * attempt, 10000);
        if (attempt < RETRIES) {
          await sleep(wait);
          continue;
        }
      }
      if (status && status < 500 && status !== 429) break;
      if (attempt < RETRIES) await sleep(1200 * attempt);
    }
  }
  const status = lastErr && lastErr.response ? lastErr.response.status : null;
  const msg = lastErr ? (status ? `HTTP ${status}` : lastErr.message) : "unknown";
  throw new Error(`Gagal mengambil ${url}: ${msg}`);
}

function extractMeta($) {
  const get = (sel) => {
    const el = $(sel).first();
    return el.length ? el.attr("content").trim() : "";
  };
  return {
    title: $("title").first().text().trim(),
    description: get('meta[name="description"]'),
    canonical: $('link[rel="canonical"]').attr("href") || "",
    robots: get('meta[name="robots"]'),
    viewport: get('meta[name="viewport"]'),
    google: get('meta[name="google"]'),
    og: {
      site_name: get('meta[property="og:site_name"]'),
      title: get('meta[property="og:title"]'),
      description: get('meta[property="og:description"]'),
      url: get('meta[property="og:url"]'),
      image: get('meta[property="og:image"]'),
      type: get('meta[property="og:type"]'),
    },
  };
}

function extractJsonLd($) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      out.push(JSON.parse($(el).text()));
    } catch (_) {}
  });
  return out;
}

function parseQualityAndLimits($) {
  const text = $(".text").text().replace(/\s+/g, " ").trim();
  const steps = [];
  $(".text ol").first().children("li").each((_, el) => {
    const direct = $(el).clone().children("ol").remove().end().text().replace(/\s+/g, " ").trim();
    const sub = $(el)
      .children("ol")
      .children("li")
      .map((_, s) => $(s).text().trim())
      .get();
    steps.push(sub.length ? { step: direct, substeps: sub } : { step: direct });
  });

  const audio = (text.match(/MP3\s*([0-9]+kbps)\s*\/\s*up to\s*([0-9]+ minutes)/i) || []).slice(1);
  const video = (text.match(/MP4\s*up to\s*([0-9]+p)\s*\/\s*up to\s*([0-9]+ minutes)/i) || []).slice(1);

  return {
    how_to: $(".text p").first().text().trim(),
    steps,
    audio: audio.length
      ? { format: "MP3", bitrate: audio[0], max_duration: audio[1] }
      : { format: "MP3", bitrate: null, max_duration: null },
    video: video.length
      ? { format: "MP4", max_quality: video[0], max_duration: video[1] }
      : { format: "MP4", max_quality: null, max_duration: null },
    form_input_label: $('label[for="link"]').text().trim(),
    input_placeholder: $('input#link').attr("placeholder") || "",
    output_formats: $('.form__formats button')
      .map((_, el) => ({
        format: $(el).text().trim().toUpperCase(),
        active_by_default: $(el).hasClass("active"),
      }))
      .get(),
    submit_label: $('button[type="submit"]').text().trim(),
  };
}

function parseSiteScript(js) {
  const endpoint = (js.match(/endpoint\s*=\s*atob\(["']([^"']+)["']\)/) || [])[1];
  const formats = /mp3\|mp4/.test(js) ? ["mp3", "mp4"] : [];
  const progressMatch = js.match(/var o=\[("checking video"[^\]]+)\]/);
  const progressList = progressMatch
    ? progressMatch[1].split(",").map((s) => s.trim().replace(/^"|"$/g, ""))
    : ["checking video", "extracting video", "converting video", "completed"];
  const errorCodesMatch = js.match(/\^\(215\|403\|429\|502\|643\|644\|648\)\$\//);
  const errorFallbackCodes = errorCodesMatch
    ? errorCodesMatch[0].match(/([0-9]+)/g)
    : ["215", "403", "429", "502", "643", "644", "648"];
  const fallbackWorkers = (js.match(/atob\(["'](aHR0cHM6Ly9mYW5jeS1zZWEtNWQzZC5ob2x5LWJyZWV6ZS1mZWM1LndvcmtlcnMuZGV2Lz9tPWk=)["']\)/) || [])[1];

  return {
    api_endpoint_host: endpoint ? "eta." + b64(endpoint) : null,
    api_endpoint_raw: endpoint ? b64(endpoint) : null,
    fallback_api: fallbackWorkers ? b64(fallbackWorkers) : null,
    video_id_regex_source:
      "(?:youtu\\.be\\/|youtube\\.com\\/(?:embed\\/|live\\/|shorts\\/)|[?&]v=)([a-zA-Z0-9-_]{11})",
    output_formats_supported: formats.length ? formats : ["mp3", "mp4"],
    progress_stages: progressList,
    error_codes_trigger_fallback: errorFallbackCodes,
    progress_poll_interval_ms: 3000,
  };
}

function parseFaq($) {
  const faq = [];
  $(".collapses .collapse").each((_, el) => {
    const q = $(el).find(".collapse__header").first().text().trim();
    const a = $(el).find(".collapse__body").first().text().replace(/\s+/g, " ").trim();
    if (q) faq.push({ question: q, answer: a });
  });
  return faq;
}

function extractVideoId(input) {
  const re = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|live\/|shorts\/)|[?&]v=)([a-zA-Z0-9-_]{11})/;
  const m = re.exec(input);
  return m ? m[1] : null;
}

function extractYouTubeUrlFormats($) {
  const formats = [];
  const bodyText = $(".text").text();
  const patterns = [
    { type: "watch", regex: /youtube\.com\/watch\?v=videoId/ },
    { type: "embed", regex: /youtube\.com\/embed\/videoId/ },
    { type: "live", regex: /youtube\.com\/live\/videoId/ },
    { type: "shorts", regex: /youtube\.com\/shorts\/videoId/ },
    { type: "youtu.be", regex: /youtu\.be\/videoId/ },
  ];
  for (const p of patterns) {
    if (p.regex.test(bodyText)) {
      formats.push({
        type: p.type,
        example: p.regex.source.replace("videoId", "VIDEO_ID"),
      });
    }
  }
  return formats.length
    ? formats
    : [
        { type: "watch", example: "youtube.com/watch?v=VIDEO_ID" },
        { type: "embed", example: "youtube.com/embed/VIDEO_ID" },
        { type: "live", example: "youtube.com/live/VIDEO_ID" },
        { type: "shorts", example: "youtube.com/shorts/VIDEO_ID" },
        { type: "youtu.be", example: "youtu.be/VIDEO_ID" },
      ];
}

async function convertViaApi(videoId, format) {
  const result = {
    video_id: videoId,
    format,
    status: "unknown",
    title: null,
    progress: null,
    progress_stage: null,
    download_url: null,
    error_code: null,
    message: null,
  };

  try {
    const { apiKey, api_endpoint_host } = global.__y2mateSite;
    if (!apiKey || !api_endpoint_host) {
      result.status = "error";
      result.message = "API key atau endpoint tidak ditemukan di halaman situs";
      return result;
    }

    const authUrl = `https://${api_endpoint_host}/api/v1/auth?api_key=${apiKey}&_=${Date.now()}`;
    const auth = await fetchText(authUrl, { responseType: "json" });
    if (!auth || auth.err > 0 || !auth.key) {
      result.status = "error";
      result.error_code = auth ? auth.err : null;
      result.message = "Autentikasi API gagal";
      return result;
    }
    const key = auth.key;

    const initUrl = `https://${api_endpoint_host}/api/v1/init?_=${Date.now()}`;
    let init;
    try {
      init = await fetchText(initUrl, {
        responseType: "json",
        headers: { Authorization: "Bearer " + key },
      });
    } catch (e) {
      result.status = "error";
      result.message = "Init konversi gagal (kemungkinan diblokir/403)";
      return result;
    }
    if (!init || init.error > 0 || !init.convertURL) {
      result.status = "error";
      result.error_code = init ? init.error : null;
      result.message = "Init konversi tidak valid";
      return result;
    }

    let convertUrl = init.convertURL;
    let data = null;

    for (let i = 0; i < 4; i++) {
      const url = convertUrl + `&v=${videoId}&f=${format}&_=${Date.now()}`;
      data = await fetchText(url, { responseType: "json" });
      if (!data) break;
      if (data.error > 0) {
        result.status = "error";
        result.error_code = data.error;
        result.message = "Konversi mengembalikan error: " + data.error;
        return result;
      }
      if (data.redirect === 1 && data.redirectURL) {
        convertUrl = data.redirectURL.split("&v=")[0];
        continue;
      }
      break;
    }

    if (!data) {
      result.status = "error";
      result.message = "Respons konversi kosong";
      return result;
    }

    if (data.title) result.title = data.title;

    if (data.status === "download" || (data.downloadURL && !data.progressURL)) {
      result.status = "completed";
      result.progress = 3;
      result.progress_stage = "completed";
      result.download_url = data.downloadURL || null;
      result.message = "Konversi selesai, file siap diunduh";
      return result;
    }

    if (data.progressURL) {
      result.status = "processing";
      result.message = "Konversi sedang berlangsung";
      for (let i = 0; i < PROGRESS_MAX_TRIES; i++) {
        await sleep(PROGRESS_POLL_MS);
        let p;
        try {
          p = await fetchText(data.progressURL + `&_=${Date.now()}`, {
            responseType: "json",
          });
        } catch (e) {
          result.message = "Polling progres gagal";
          continue;
        }
        if (!p) continue;
        if (p.error > 0) {
          result.status = "error";
          result.error_code = p.error;
          result.message = "Error saat proses: " + p.error;
          return result;
        }
        if (p.title && !result.title) result.title = p.title;
        result.progress = p.progress;
        result.progress_stage =
          global.__y2mateSite.progress_stages[p.progress] || String(p.progress);
        if (p.progress >= 3) {
          result.status = "completed";
          result.download_url = data.downloadURL || null;
          result.message = "Konversi selesai, file siap diunduh";
          return result;
        }
      }
      result.status = "timeout";
      result.message = "Timeout menunggu konversi selesai";
      return result;
    }

    result.status = "unknown";
    result.message = "Respons tidak dikenali";
    result.raw = data;
    return result;
  } catch (e) {
    result.status = "error";
    result.message = e.message;
    return result;
  }
}

async function scrapeSite() {
  const homeHtml = await fetchText(BASE_URL + "/");
  const $ = cheerio.load(homeHtml);

  let jsUrl = $("script[src]").filter((_, el) => /y2mate\.js/.test($(el).attr("src") || ""));
  jsUrl = jsUrl.length ? jsUrl.attr("src") : "";
  if (jsUrl.startsWith("/")) jsUrl = BASE_URL + jsUrl;

  const siteScript = jsUrl ? parseSiteScript(await fetchText(jsUrl)) : {};

  let apiKey = "";
  $("script").each((_, el) => {
    if (apiKey) return;
    const m = ($(el).text() || "").match(/var\s+apiKey\s*=\s*['"]([^'"]+)['"]/);
    if (m) apiKey = m[1];
  });
  siteScript.api_key_found = Boolean(apiKey);
  siteScript.api_key = apiKey || null;

  let faqHtml = "";
  try {
    faqHtml = await fetchText(BASE_URL + "/faq/");
  } catch (_) {}
  const $faq = faqHtml ? cheerio.load(faqHtml) : null;

  return {
    url: BASE_URL,
    scraped_at: new Date().toISOString(),
    site: {
      title: $("title").text().trim(),
      description: $('meta[name="description"]').attr("content") || "",
      og_title: $('meta[property="og:title"]').attr("content") || "",
      og_description: $('meta[property="og:description"]').attr("content") || "",
      og_url: $('meta[property="og:url"]').attr("content") || "",
      og_image: $('meta[property="og:image"]').attr("content") || "",
      og_type: $('meta[property="og:type"]').attr("content") || "",
      og_site_name: $('meta[property="og:site_name"]').attr("content") || "",
      canonical: $('link[rel="canonical"]').attr("href") || "",
      language: $("html").attr("lang") || "",
      json_ld: extractJsonLd($),
    },
    page_metadata: extractMeta($),
    supported_input_formats: extractYouTubeUrlFormats($),
    converter: parseQualityAndLimits($),
    backend: siteScript,
    faq: $faq ? parseFaq($faq) : [],
  };
}

async function main() {
  const target = process.argv[2] || "";
  const out = { success: true, error: null, data: null };

  try {
    const siteData = await scrapeSite();
    global.__y2mateSite = {
      apiKey: siteData.backend.api_key,
      api_endpoint_host: siteData.backend.api_endpoint_host,
      progress_stages: siteData.backend.progress_stages || [],
    };

    if (target) {
      const videoId = extractVideoId(target);
      if (!videoId) {
        out.success = false;
        out.error = "URL YouTube tidak valid. Gunakan format watch, shorts, live, embed, atau youtu.be";
        out.data = siteData;
        console.log(JSON.stringify(out, null, 2));
        process.exit(1);
      }
      const formatArg = (process.argv[3] || "mp3").toLowerCase();
      const requestedFormat = /^(mp3|mp4)$/.test(formatArg) ? formatArg : "mp3";
      siteData.conversion = await convertViaApi(videoId, requestedFormat);
      siteData.conversion_input = { url: target, video_id: videoId };
    }

    out.data = siteData;
  } catch (e) {
    out.success = false;
    out.error = e.message;
  }

  const json = JSON.stringify(out, null, 2);
  console.log(json);
  const outFile = path.join(__dirname, "y2mate-output.json");
  try {
    fs.writeFileSync(outFile, json, "utf8");
  } catch (_) {}
  process.exit(out.success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { scrapeSite, convertViaApi, extractVideoId };