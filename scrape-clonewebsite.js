#!/usr/bin/env node
"use strict";

/**
 * Name : clone website target
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base web : https(.)copywebsitetarget(.)netlify(.)app
 * Type : Scraper
 * Description : Mengambil "source code" sebuah website selengkap mungkin lalu mengemasnya menjadi struktur folder + file ZIP, dan menulis manifest JSON.
 * Note : Yang diambil:
HTML (halaman root + halaman same-origin yang ditautkan), CSS (termasuk @import dan url() bersarang), JavaScript (termasuk dynamic import / chunk Vite), Source Maps (*.map) -> memulihkan file asli (TS/TSX/JSX/Vue/JS/CSS) dari field "sourcesContent" persis seperti saat develop, Gambar (png/jpg/jpeg/webp/gif/svg/ico/avif/bmp), Font web (woff/woff2/ttf/otf/eot), Data JSON / webmanifest (+ ikon & shortcut di dalamnya), Inline <style> / style="" / inline <script>
Dependensi : axios + cheerio. Scrape ini kompatibel pada Node.js >= 18 (keatas). Btw error fix sendiri
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const axios = require("axios");
const cheerio = require("cheerio");

/* ============================ KONFIGURASI =============================== */

const DEFAULTS = {
  url: "https://copywebsitetarget.netlify.app/",
  out: "./output",
  timeout: 30000,
  retries: 3,
  concurrency: 6,
  depth: 2,
  maxPages: 50,
  maxAssets: 3000,
  external: true,
  inline: false,
  zip: true,
};

const UA =
  "Mozilla/5.0 (Linux; Android 12; Termux) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 CopyWebsite/1.0";

const TEXT_EXT = new Set([
  ".html", ".htm", ".css", ".js", ".mjs", ".cjs", ".json", ".map",
  ".webmanifest", ".svg", ".xml", ".txt", ".ts", ".tsx", ".jsx",
  ".vue", ".md", ".csv", ".yaml", ".yml",
]);

const IMAGE_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".avif", ".bmp",
]);
const FONT_EXT = new Set([".woff", ".woff2", ".ttf", ".otf", ".eot"]);
const JS_EXT = new Set([".js", ".mjs", ".cjs"]);
const CODE_EXT = new Set([".ts", ".tsx", ".jsx", ".vue", ".js", ".css", ".scss"]);

/* =========================== UTIL UMUM ================================== */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowStamp = () => new Date().toISOString().replace(/[:.]/g, "-");
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

function parseArgs(argv) {
  const opts = { ...DEFAULTS };
  const positional = [];
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      const key = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (["external", "inline", "zip"].includes(key)) {
        opts[key] = v === undefined ? true : v !== "false" && v !== "0";
      } else if (v !== undefined && !Number.isNaN(Number(v))) {
        opts[key] = Number(v);
      } else if (v !== undefined) {
        opts[key] = v;
      }
    } else if (/^https?:\/\//i.test(a)) {
      positional.push(a);
    }
  }
  if (positional[0]) opts.url = positional[0];
  if (!/^https?:\/\//i.test(opts.url)) opts.url = "https://" + opts.url;
  return opts;
}

function extFromUrl(u) {
  try {
    const p = new URL(u).pathname;
    const e = path.extname(p).toLowerCase();
    return e;
  } catch {
    return "";
  }
}

function resolveUrl(base, ref) {
  if (!ref || typeof ref !== "string") return null;
  const r = ref.trim().replace(/^["']|["']$/g, "");
  if (!r) return null;
  if (/^(data:|blob:|mailto:|tel:|javascript:|about:|#)/i.test(r)) return null;
  try {
    const u = new URL(r, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.href;
  } catch {
    return null;
  }
}

function sanitizeRel(rel) {
  const parts = String(rel).split(/[\\/]+/).filter((s) => s && s !== ".");
  const out = [];
  for (const s of parts) {
    if (s === "..") out.pop();
    else out.push(s);
  }
  return out.join("/");
}

function filePathFor(url, { isHtml = false, isExternal = false } = {}) {
  const u = new URL(url);
  let p = decodeURIComponent(u.pathname || "/");
  if (!p || p === "/") p = "/index.html";
  else if (p.endsWith("/")) p += "index.html";
  else {
    const ext = path.extname(p);
    if (isHtml && !ext) p = p.replace(/\/?$/, "") + "/index.html";
  }
  p = sanitizeRel(p);
  if (!p) p = "index.html";
  if (isExternal) p = path.posix.join("_external", u.hostname, p);
  return p;
}

/* ========================= MIME / KLASIFIKASI =========================== */

function classifyType(ctype, ext) {
  if (ctype === "text/html" || ext === ".html" || ext === ".htm") return "html";
  if (ctype.includes("css") || ext === ".css" || ext === ".scss") return "css";
  if (/javascript|ecmascript/.test(ctype) || JS_EXT.has(ext)) return "javascript";
  if (/typescript/.test(ctype) || ext === ".ts" || ext === ".tsx") return "typescript";
  if (ext === ".jsx" || ext === ".vue") return "source";
  if (ext === ".map" || /sourcemap/.test(ctype)) return "sourcemap";
  if (ctype.includes("json") || ext === ".json" || ext === ".webmanifest") return "json";
  if (ctype.includes("svg") || ext === ".svg") return "svg";
  if (ctype.startsWith("image/") || IMAGE_EXT.has(ext)) return "image";
  if (ctype.includes("font") || FONT_EXT.has(ext)) return "font";
  if (ctype.includes("wasm") || ext === ".wasm") return "wasm";
  if (
    ctype.startsWith("audio/") ||
    ctype.startsWith("video/") ||
    [".mp3", ".mp4", ".webm", ".ogg", ".m4a"].includes(ext)
  )
    return "media";
  if (ctype.startsWith("text/") || ctype.includes("xml")) return "text";
  return "other";
}

function isTextType(ctype, ext, type) {
  if (ctype.startsWith("text/")) return true;
  if (/json|javascript|ecmascript|xml|svg|x-sh|yaml/.test(ctype)) return true;
  if (TEXT_EXT.has(ext)) return true;
  return ["html", "css", "javascript", "typescript", "json", "sourcemap", "svg", "source", "text"].includes(type);
}

/* ============================= FETCHER ================================== */

async function fetchResource(url, opts) {
  let lastErr;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: opts.timeout,
        maxRedirects: 5,
        decompress: true,
        validateStatus: () => true,
        headers: {
          "User-Agent": UA,
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        },
      });
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < opts.retries) await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr;
}

/* ========================= PENEMUAN ASET (REGEX) ======================== */

const ASSET_RE = new RegExp(
  "[\"'`(\\s](?:\\.{0,2}\\/|/)?[^\"'`\\s(){}<>]+?\\.(" +
    "png|jpe?g|webp|gif|svg|ico|avif|bmp|" +
    "woff2?|ttf|otf|eot|" +
    "json|webmanifest|xml|wasm|mp4|webm|mp3|ogg|pdf|" +
    "css|js|mjs|cjs|map|txt" +
    ")(?:\\?[^\"'`\\s(){}<>]*)?[\"'`)\\s]",
  "gi"
);

function findAssetRefs(text) {
  const found = new Set();
  let m;
  ASSET_RE.lastIndex = 0;
  while ((m = ASSET_RE.exec(text)) !== null) {
    let ref = m[0].slice(1, -1).trim();
    ref = ref.replace(/^["'`(]|["'`)]$/g, "").trim();
    if (!ref || ref.length > 400) continue;
    if (/\s/.test(ref)) continue;
    const base = path.posix.basename(ref.split("?")[0]);
    const stem = base.slice(0, base.length - path.extname(base).length);
    if (!/[A-Za-z0-9]/.test(stem)) continue; // buang pola ".png/.svg/.webp" (bukan file asli)
    found.add(ref);
  }
  return [...found];
}

function findSourceMapUrl(text, isCss) {
  if (isCss) {
    const m = text.match(/\/\*[#@]\s*sourceMappingURL=([^\s*]+)\s*\*\//);
    if (m) return m[1].trim();
  }
  const m = text.match(/\/\/[#@]\s*sourceMappingURL=([^\s]+)/);
  if (m) return m[1].trim();
  const m2 = text.match(/sourceMappingURL=([^\s"';]+)/);
  return m2 ? m2[1].trim() : null;
}

function extractCssRefs(cssText) {
  const refs = new Set();
  const urlRe = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let m;
  while ((m = urlRe.exec(cssText)) !== null) refs.add(m[2].trim());
  const importRe = /@import\s+(?:url\(\s*)?(['"]?)([^'")]+)\1/gi;
  while ((m = importRe.exec(cssText)) !== null) refs.add(m[2].trim());
  return [...refs];
}

/* ====================== PEMULIHAN SOURCE MAP ============================ */

function recoverFromSourceMap(mapJson, mapUrl, outDir, records) {
  const recovered = [];
  if (!mapJson || typeof mapJson !== "object") return recovered;
  const sources = Array.isArray(mapJson.sources) ? mapJson.sources : [];
  const contents = Array.isArray(mapJson.sourcesContent) ? mapJson.sourcesContent : [];
  const root = mapJson.sourceRoot ? String(mapJson.sourceRoot) : "";

  for (let i = 0; i < sources.length; i++) {
    const content = contents[i];
    if (content == null) continue;
    let src = String(sources[i]);
    src = src.replace(/^[a-zA-Z][\w+.-]*:\/\//, ""); // buang protokol (webpack://, file://)
    src = src.replace(/^(webpack|file|rollup|ng):?/, "");
    if (root) src = root + "/" + src;
    // buang prefix host/nama project (segmen pertama) agar rapi
    const rel = sanitizeRel(src);
    if (!rel) continue;
    const localPath = path.posix.join("_recovered", rel);
    const abs = path.join(outDir, localPath);
    try {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    } catch {
      continue;
    }
    const ext = path.extname(rel).toLowerCase();
    const rec = {
      path: localPath,
      url: null,
      type: classifyType("", ext),
      contentType: "",
      size: Buffer.byteLength(content, "utf8"),
      language: CODE_EXT.has(ext) ? ext.slice(1) : null,
      recoveredFrom: mapUrl,
      source: src,
    };
    records.set(localPath, rec);
    recovered.push(rec);
  }
  return recovered;
}

/* ============================ ZIP WRITER ================================ */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function dosDateTime(d) {
  return {
    time:
      ((d.getHours() & 0x1f) << 11) |
      ((d.getMinutes() & 0x3f) << 5) |
      ((Math.floor(d.getSeconds() / 2)) & 0x1f),
    date:
      ((((d.getFullYear() - 1980) & 0x7f) << 9) |
        (((d.getMonth() + 1) & 0x0f) << 5) |
        (d.getDate() & 0x1f)) >>>
      0,
  };
}

function createZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name.replace(/\\/g, "/"), "utf8");
    const data = e.data;
    const crc = crc32(data);
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = compressed.length < data.length;
    const method = useDeflate ? 8 : 0;
    const out = useDeflate ? compressed : data;
    const { time, date } = dosDateTime(e.mtime || new Date());

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(time, 10);
    lh.writeUInt16LE(date, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(out.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);

    chunks.push(lh, nameBuf, out);
    central.push({ nameBuf, crc, method, time, date, compSize: out.length, size: data.length, offset });
    offset += lh.length + nameBuf.length + out.length;
  }

  const cdStart = offset;
  for (const c of central) {
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(0x031e, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(c.method, 10);
    ch.writeUInt16LE(c.time, 12);
    ch.writeUInt16LE(c.date, 14);
    ch.writeUInt32LE(c.crc, 16);
    ch.writeUInt32LE(c.compSize, 20);
    ch.writeUInt32LE(c.size, 24);
    ch.writeUInt16LE(c.nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(c.offset, 42);
    chunks.push(ch, c.nameBuf);
    offset += ch.length + c.nameBuf.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(central.length, 8);
  eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(offset - cdStart, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);
  chunks.push(eocd);

  return Buffer.concat(chunks);
}

/* ============================ CRAWLER =================================== */

function decodeText(buf, ctype) {
  const m = /charset=([\w-]+)/i.exec(ctype || "");
  const enc = m ? m[1].toLowerCase() : "utf8";
  try {
    return buf.toString(enc === "utf-8" ? "utf8" : enc);
  } catch {
    return buf.toString("utf8");
  }
}

function extractHtmlRefs($, pageUrl) {
  const resources = [];
  const pages = [];
  const push = (ref, kind) => {
    const u = resolveUrl(pageUrl, ref);
    if (u) resources.push({ url: u, kind });
  };

  $("link[href]").each((_, el) => {
    const rel = ($(el).attr("rel") || "").toLowerCase();
    const href = $(el).attr("href");
    if (/stylesheet|icon|apple-touch-icon|manifest|preload|prefetch|modulepreload/.test(rel)) push(href, "link");
  });
  $("script[src]").each((_, el) => push($(el).attr("src"), "script"));
  $("img[src],source[src],video[src],audio[src],embed[src],object[data]").each((_, el) => {
    push($(el).attr("src") || $(el).attr("data"), "media");
  });
  $("[srcset]").each((_, el) => {
    const ss = $(el).attr("srcset") || "";
    ss.split(",").forEach((part) => push(part.trim().split(/\s+/)[0], "media"));
  });
  $("video[poster]").each((_, el) => push($(el).attr("poster"), "media"));

  // inline style blocks & atribut style
  $("style").each((_, el) => {
    extractCssRefs($(el).html() || "").forEach((r) => push(r, "css"));
  });
  $("[style]").each((_, el) => {
    extractCssRefs($(el).attr("style") || "").forEach((r) => push(r, "css"));
  });
  // inline scripts -> cari aset & sourcemap
  $("script:not([src])").each((_, el) => {
    const code = $(el).html() || "";
    findAssetRefs(code).forEach((r) => push(r, "asset"));
  });

  // anchor same-origin untuk "pagination"/halaman tambahan
  $("a[href]").each((_, el) => {
    const u = resolveUrl(pageUrl, $(el).attr("href"));
    if (u) pages.push(u);
  });

  return { resources, pages };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const startTime = Date.now();
  const base = new URL(opts.url);
  const baseHost = base.hostname;

  const runName = `${baseHost}-${nowStamp()}`;
  const outDir = path.resolve(opts.out, runName);
  fs.mkdirSync(outDir, { recursive: true });

  const records = new Map(); // localPath -> meta
  const visited = new Set(); // url key
  const seenPaths = new Set();
  const errors = [];
  const skipped = [];
  const recovered = [];

  const log = (...a) => process.stderr.write("[scrape] " + a.join(" ") + "\n");

  log("Target :", opts.url);
  log("Output :", outDir);

  const urlKey = (u) => {
    try {
      const x = new URL(u);
      return x.origin + x.pathname + x.search;
    } catch {
      return u;
    }
  };

  const queue = [];
  function enqueue(url, meta) {
    if (!url) return null;
    const u = new URL(url);
    const sameHost = u.hostname === baseHost;
    if (!opts.external && !sameHost && (meta && meta.kind !== "page")) return null;
    const key = urlKey(url);
    if (visited.has(key)) return null;
    if (records.size + queue.length >= opts.maxAssets) return null;
    visited.add(key);
    const item = { url, sameHost, ...meta };
    queue.push(item);
    return item;
  }

  enqueue(base.href, { kind: "page", depth: 0, isRoot: true });

  let pagesCrawled = 0;
  let activeIndex = 0;

  async function processItem(item) {
    const { url, kind, depth, isRoot } = item;
    const urlObj = new URL(url);
    const sameHost = urlObj.hostname === baseHost;
    let res;
    try {
      res = await fetchResource(url, opts);
    } catch (e) {
      errors.push({ url, error: e.code || e.message });
      log("ERR fetch", url, "-", e.code || e.message);
      return;
    }

    const status = res.status;
    const finalUrl = res.request?.res?.responseUrl || url;
    let buf = Buffer.from(res.data || []);
    const ctype = String(res.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
    const ext = extFromUrl(finalUrl);
    const type = classifyType(ctype, ext);

    if (status < 200 || status >= 300) {
      errors.push({ url, status });
      log("HTTP", status, url);
      return;
    }
    if (buf.length === 0) {
      errors.push({ url, status, error: "empty body" });
      return;
    }

    // Deteksi SPA fallback: minta aset tapi server balas HTML
    const wantsHtml = isRoot || (!ext && kind === "page") || [".html", ".htm"].includes(ext);
    if (ctype === "text/html" && !wantsHtml) {
      skipped.push({ url, status, reason: "spa-fallback (bukan file asli)" });
      log("SKIP fallback:", url);
      return;
    }

    const text = isTextType(ctype, ext, type) ? decodeText(buf, String(res.headers["content-type"] || "")) : null;
    const isExternal = !sameHost;
    const isHtml = ctype === "text/html" || [".html", ".htm"].includes(ext);
    const localPath = filePathFor(finalUrl, { isHtml, isExternal });

    if (records.has(localPath) || seenPaths.has(localPath)) {
      visited.add(urlKey(url));
      return;
    }
    seenPaths.add(localPath);

    const abs = path.join(outDir, localPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, buf);

    const rec = {
      path: localPath,
      url: finalUrl,
      type,
      contentType: ctype || null,
      size: buf.length,
      sha256: sha256(buf),
      external: isExternal || undefined,
      status,
    };
    if (text !== null && text.length <= 200000) {
      rec.preview = text.slice(0, 400);
      if (opts.inline && buf.length <= 2 * 1024 * 1024) rec.content = text;
    }
    records.set(localPath, rec);

    log("OK", String(status), type, localPath, `(${buf.length}b)`);

    /* --- Parsing lanjutan sesuai tipe --- */
    if (type === "html" && text) {
      if (depth <= opts.depth && pagesCrawled < opts.maxPages) {
        pagesCrawled++;
        const $ = cheerio.load(text);
        const { resources, pages } = extractHtmlRefs($, finalUrl);
        for (const r of resources) enqueue(r.url, { kind: r.kind, depth: depth + 1 });
        for (const p of pages) {
          const pu = new URL(p);
          if (pu.hostname === baseHost) enqueue(p, { kind: "page", depth: depth + 1 });
        }
      }
    } else if (type === "css" && text) {
      for (const r of extractCssRefs(text)) {
        const u = resolveUrl(finalUrl, r);
        if (u) enqueue(u, { kind: "css-asset", depth: depth + 1 });
      }
      const sm = findSourceMapUrl(text, true);
      if (sm) {
        const u = resolveUrl(finalUrl, sm);
        if (u) enqueue(u, { kind: "sourcemap", depth: depth + 1 });
      }
    } else if ((type === "javascript" || type === "typescript") && text) {
      for (const r of findAssetRefs(text)) {
        const u = resolveUrl(finalUrl, r);
        if (u) enqueue(u, { kind: "js-asset", depth: depth + 1 });
      }
      const sm = findSourceMapUrl(text, false);
      if (sm) {
        const u = resolveUrl(finalUrl, sm);
        if (u) enqueue(u, { kind: "sourcemap", depth: depth + 1 });
      }
    } else if (type === "json" && text) {
      try {
        const j = JSON.parse(text);
        const list = [];
        if (Array.isArray(j.icons)) j.icons.forEach((i) => i && i.src && list.push(i.src));
        if (Array.isArray(j.shortcuts)) j.shortcuts.forEach((s) => s && s.url && list.push(s.url));
        if (Array.isArray(j.screenshots)) j.screenshots.forEach((s) => s && s.src && list.push(s.src));
        for (const r of list) {
          const u = resolveUrl(finalUrl, r);
          if (u) enqueue(u, { kind: "manifest-asset", depth: depth + 1 });
        }
      } catch {
        /* bukan JSON valid */
      }
    } else if (type === "sourcemap" && text) {
      try {
        const mapJson = JSON.parse(text);
        const recs = recoverFromSourceMap(mapJson, finalUrl, outDir, records);
        recovered.push(...recs);
        log("SOURCE-MAP dipulihkan:", recs.length, "file asli dari", localPath);
      } catch (e) {
        errors.push({ url, error: "sourcemap parse: " + e.message });
      }
    }
  }

  // worker pool dengan queue dinamis
  async function worker() {
    while (activeIndex < queue.length) {
      const item = queue[activeIndex++];
      try {
        await processItem(item);
      } catch (e) {
        errors.push({ url: item.url, error: e.message });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, opts.concurrency) }, worker));

  /* --------------------------- Manifest ---------------------------- */
  const files = [...records.values()].sort((a, b) => a.path.localeCompare(b.path));
  const stats = { totalFiles: files.length, totalBytes: 0, byType: {} };
  for (const f of files) {
    stats.totalBytes += f.size;
    stats.byType[f.type] = (stats.byType[f.type] || 0) + 1;
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    target: opts.url,
    host: baseHost,
    options: {
      depth: opts.depth,
      maxPages: opts.maxPages,
      maxAssets: opts.maxAssets,
      external: opts.external,
      concurrency: opts.concurrency,
      timeout: opts.timeout,
    },
    stats,
    sourceMaps: {
      found: files.filter((f) => f.type === "sourcemap").length,
      recoveredFiles: recovered.length,
    },
    recoveredSources: recovered.map((r) => ({ path: r.path, language: r.language, recoveredFrom: r.recoveredFrom })),
    files,
    errors,
    skipped,
    outputDir: outDir,
  };

  const manifestPath = path.join(outDir, "_manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  /* ----------------------------- ZIP ------------------------------- */
  let zipPath = null;
  if (opts.zip) {
    const zipName = `${baseHost}-source-${nowStamp()}.zip`;
    zipPath = path.resolve(opts.out, zipName);
    const entries = [];
    const walk = (dir, prefix = "") => {
      for (const name of fs.readdirSync(dir)) {
        const fp = path.join(dir, name);
        const st = fs.statSync(fp);
        if (st.isDirectory()) walk(fp, path.posix.join(prefix, name));
        else
          entries.push({
            name: path.posix.join(runName, prefix, name),
            data: fs.readFileSync(fp),
            mtime: st.mtime,
          });
      }
    };
    walk(outDir);
    fs.writeFileSync(zipPath, createZip(entries));
    manifest.zip = zipPath;
    manifest.zipSize = fs.statSync(zipPath).size;
    // tulis ulang manifest dgn info zip
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    log("ZIP    :", zipPath, `(${(manifest.zipSize / 1024).toFixed(1)} KB)`);
    // tambahkan manifest.json ke dalam zip? tidak, sudah ada _manifest.json
  }

  /* --------------------------- Ringkasan --------------------------- */
  const summary = {
    success: true,
    target: opts.url,
    host: baseHost,
    totalFiles: stats.totalFiles,
    totalBytes: stats.totalBytes,
    byType: stats.byType,
    sourceMaps: manifest.sourceMaps,
    outputDir: outDir,
    manifest: manifestPath,
    zip: zipPath,
    errors: errors.length,
    skipped: skipped.length,
    files: files.map((f) => ({
      path: f.path,
      type: f.type,
      size: f.size,
      url: f.url,
      external: f.external || false,
    })),
  };

  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
}

if (require.main === module) {
  main().catch((e) => {
    process.stderr.write(
      JSON.stringify({ success: false, error: e.message, stack: e.stack }, null, 2) + "\n"
    );
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  classifyType,
  extractCssRefs,
  findAssetRefs,
  findSourceMapUrl,
  recoverFromSourceMap,
  createZip,
  filePathFor,
  sanitizeRel,
  resolveUrl,
};