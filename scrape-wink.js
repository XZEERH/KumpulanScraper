#!/usr/bin/env node
'use strict';

/**
 * Name :wink.ai (enhancer image HD/Ultra HD/UHD)
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://wink.ai
 * Type : scraper
 * Method : GET+POST
 * Description : Tingkatkan kualitas gambar anda dengan pilihan kualitas HD, Ultra HD dan UHD.
 * Note : error fix sendiri
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// jpeg-js bersifat opsional: hanya dipakai untuk analisa ketajaman JPEG.
let jpegJs = null;
try { jpegJs = require('jpeg-js'); } catch (_) { jpegJs = null; }

// ----------------------------- konfigurasi -----------------------------
const DEFAULTS = {
  site: 'https://wink.ai',
  page: 'https://wink.ai/image-enhancer',
  out: 'wink-image-enhancer.json',
  timeout: 30000,
  retries: 3,
  maxRedirects: 5,
  userAgent:
    'Mozilla/5.0 (Linux; Android 12; Termux) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/120.0 Mobile Safari/537.36 wink-scraper/1.0',
  acceptLanguage: 'en-US,en;q=0.9',
};

// ----------------------------- utilitas -----------------------------
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};
const bold = (s) => C.bold + s + C.reset;
const dim = (s) => C.dim + s + C.reset;
const green = (s) => C.green + s + C.reset;
const yellow = (s) => C.yellow + s + C.reset;
const red = (s) => C.red + s + C.reset;
const cyan = (s) => C.cyan + s + C.reset;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/\s+/g, ' ')
    .trim();
}

function humanBytes(n) {
  if (n === null || n === undefined) return null;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

// Ekstensi file sesuai format gambar.
function extForFormat(fmt) {
  return { JPEG: '.jpg', PNG: '.png', WEBP: '.webp', GIF: '.gif', BMP: '.bmp' }[fmt] || '.img';
}

// Nama file otomatis: wink-YYYYMMDD-HHMMSS.<ext>
function autoImageName(fmt) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp =
    d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' +
    p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  return 'wink-' + stamp + extForFormat(fmt);
}

// Ambil objek JSON seimbang mulai dari indeks '{'.
function extractBalanced(str, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) return i + 1; }
    }
  }
  return -1;
}

// Cari "key":{...} lalu parse sebagai JSON.
function extractObjectByKey(html, key) {
  const needle = '"' + key + '":';
  let from = 0, idx;
  while ((idx = html.indexOf(needle, from)) !== -1) {
    from = idx + 1;
    let j = idx + needle.length;
    while (j < html.length && /\s/.test(html[j])) j++;
    if (html[j] !== '{') continue;
    const end = extractBalanced(html, j);
    if (end === -1) continue;
    try { return JSON.parse(html.slice(j, end)); } catch (_) { /* coba berikutnya */ }
  }
  return null;
}

// ----------------------------- HTTP -----------------------------
async function httpGet(url, opts = {}) {
  const retries = opts.retries !== undefined ? opts.retries : DEFAULTS.retries;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axios.get(url, {
        timeout: opts.timeout || DEFAULTS.timeout,
        maxRedirects: DEFAULTS.maxRedirects,
        responseType: opts.responseType || 'text',
        validateStatus: () => true,
        headers: Object.assign(
          { 'User-Agent': DEFAULTS.userAgent, 'Accept-Language': DEFAULTS.acceptLanguage },
          opts.headers || {}
        ),
      });
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await sleep(400 * Math.pow(2, attempt));
    }
  }
  throw lastErr;
}

// ----------------------------- parsing metadata -----------------------------
function extractJsonLd($) {
  const blocks = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    try { blocks.push(JSON.parse($(el).contents().text())); } catch (_) {}
  });
  return blocks;
}

function findFaq(blocks) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'Question' && node.name) {
      out.push({
        question: stripHtml(node.name),
        answer: node.acceptedAnswer ? stripHtml(node.acceptedAnswer.text || node.acceptedAnswer) : null,
      });
    }
    const graph = node['@graph'] || node.mainEntity;
    if (Array.isArray(graph)) graph.forEach(walk);
  };
  blocks.forEach(walk);
  return out;
}

function findHowTo(blocks) {
  const steps = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'HowToStep') {
      steps.push({ step: node.position || steps.length + 1, name: stripHtml(node.name), description: stripHtml(node.text) });
    }
    if (Array.isArray(node.itemListElement)) node.itemListElement.forEach(walk);
    if (Array.isArray(node['@graph'])) node['@graph'].forEach(walk);
  };
  blocks.forEach(walk);
  return steps.sort((a, b) => a.step - b.step);
}

function findWebsite(blocks) {
  const walk = (node) => {
    if (!node || typeof node !== 'object') return null;
    if (node['@type'] === 'WebSite') return node;
    const g = node['@graph'];
    if (Array.isArray(g)) for (const n of g) { const r = walk(n); if (r) return r; }
    return null;
  };
  for (const b of blocks) { const r = walk(b); if (r) return r; }
  return null;
}

function extractFeatureSections($) {
  const sections = [];
  const nodes = $('.pseo__feature-item');
  if (nodes.length) {
    nodes.each((i, el) => {
      const title = $(el).find('h2, h3').first().text().replace(/\s+/g, ' ').trim();
      const desc = $(el).find('p').map((j, p) => stripHtml($(p).text())).get().filter(Boolean).join(' ');
      if (title) sections.push({ title, description: desc || null });
    });
  }
  // Fallback bila struktur kelas berubah: kumpulkan h2 + paragraf berikutnya.
  if (!sections.length) {
    $('h2').each((i, el) => {
      const title = $(el).text().replace(/\s+/g, ' ').trim();
      if (!title) return;
      const p = $(el).nextAll('p, div').find('p').first().text();
      sections.push({ title, description: stripHtml(p) || null });
    });
  }
  return sections;
}

function extractRelated($) {
  const out = [];
  $('a').each((i, el) => {
    const h3 = $(el).find('h3').first();
    const title = h3.length ? h3.text().replace(/\s+/g, ' ').trim() : '';
    const href = $(el).attr('href');
    if (title && href && !/^(#|mailto:|javascript:)/.test(href)) {
      const url = href.startsWith('http') ? href : DEFAULTS.site + (href.startsWith('/') ? href : '/' + href);
      if (!out.some((x) => x.url === url)) out.push({ title, url });
    }
  });
  return out;
}

// Unescape payload Next.js (self.__next_f) => teks JSON ber-quote ganda.
// PENTING: jangan konversi "\n" => newline; pertahankan sebagai escape JSON
// agar string multi-baris (mis. Readme) tetap valid untuk JSON.parse.
function unescapeNextPayload(html) {
  return html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

const PRIMARY_MODES = [
  {
    id: 'HD',
    name: 'HD',
    aliases: ['hd'],
    tier: 'free',
    premium: false,
    description:
      'Peningkatan kejernihan standar: memperjelas gambar buram, menajamkan tepi/detail, dan menaikkan resolusi rendah ke kualitas HD.',
    features: ['Penajaman (sharpening) standar', 'Peningkatan kejernihan', 'Upscale ke HD'],
    input_resolution: 'resolusi rendah hingga sedang',
    output_resolution: 'HD (kelas 720p–1080p)',
    upscale_factor: null,
    documented: false,
    inferred: true,
    note: 'Halaman tidak mempublikasikan angka resolusi in/out eksplisit untuk mode HD; nilai ini disimpulkan dari teks "upscale ... to HD or 4K".',
    source: 'wink.ai/image-enhancer (meta description + konten)',
  },
  {
    id: 'Ultra HD',
    name: 'Ultra HD',
    aliases: ['ultra hd', 'ultrahd', 'ultra-hd'],
    tier: 'free',
    premium: false,
    description:
      'Mode gratis yang direkomendasikan untuk peningkatan umum. Meningkatkan ketajaman dan menaikkan foto resolusi rendah ke kualitas Ultra HD/4K dengan tetap menjaga tampilan natural.',
    features: ['Restorasi + penajaman', 'Upscale hingga Ultra HD/4K', 'Direkomendasikan untuk pemakaian gratis'],
    input_resolution: 'resolusi rendah–tinggi (didukung hingga 4K)',
    output_resolution: 'Ultra HD / 4K (kelas 3840×2160)',
    upscale_factor: null,
    documented: true,
    inferred: true,
    note: 'Status mode gratis & rekomendasi terdokumentasi di FAQ; angka resolusi output disimpulkan dari klaim "up to 4K".',
    source: 'FAQ: "Free mode: Ultra HD is highly recommended..." + meta "upscale ... to HD or 4K"',
  },
  {
    id: 'AI UHD',
    name: 'AI UHD',
    aliases: ['ai uhd', 'aiuhd', 'uhd', 'ai-uhd'],
    tier: 'premium',
    premium: true,
    description:
      'AI UHD Level: Advanced Restoration 3.0. AI mengisi detail gambar yang hilang, memulihkan tekstur/struktur, dan dapat memperbesar gambar 2–3× tanpa kehilangan tepi bersih.',
    features: ['Advanced Restoration 3.0', 'AI mengisi detail yang hilang', 'Perbesar 2–3×', 'Rebuild struktur (teks, ikon, detail kecil tetap tajam)'],
    input_resolution: 'resolusi rendah (mendukung gambar hingga 4K)',
    output_resolution: '2–3× dari input (di atas Ultra HD)',
    upscale_factor: '2–3x',
    documented: true,
    inferred: false,
    note: 'Faktor perbesaran 2–3× terdokumentasi eksplisit di FAQ.',
    source: 'QualityRestoration.Cards.AIUHD.Desc + FAQ "...enlarge the image by 2–3×"',
  },
];

function normalizeMode(mode) {
  if (!mode) return null;
  const key = String(mode).trim().toLowerCase().replace(/\s+/g, ' ');
  for (const m of PRIMARY_MODES) {
    if (m.id.toLowerCase() === key) return m;
    if (m.aliases.includes(key)) return m;
  }
  if (key === 'ultra' || key === 'ultra-hd') return PRIMARY_MODES[1];
  return null;
}

function deriveSceneModes(payload) {
  const qr = payload && payload.QualityRestoration;
  if (!qr || !qr.Cards) return [];
  const meta = {
    AIUHD: { premium: true, upscale_factor: '2–3x' },
    Anime: { premium: true }, Game: { premium: true }, PortraitEnhancement: { premium: true },
    Concert: { premium: true }, Portrait: { premium: true }, Scenary: { premium: true },
  };
  return Object.keys(qr.Cards).map((k) => {
    const c = qr.Cards[k] || {};
    const m = meta[k] || {};
    return {
      id: k,
      name: c.Title || k,
      description: c.Desc || null,
      premium: !!m.premium,
      tier: m.premium ? 'premium' : 'free',
      upscale_factor: m.upscale_factor || null,
      source: 'payload i18n: QualityRestoration.Cards.',
    };
  });
}

function keysToPlan(payload, keys) {
  const out = {};
  for (const k of keys) if (payload[k]) out[k] = payload[k];
  return out;
}

async function scrapeMetadata(pageUrl, opts) {
  const url = pageUrl || DEFAULTS.page;
  const res = await httpGet(url, { responseType: 'text', timeout: opts.timeout, retries: opts.retries });
  const status = res.status;
  const html = typeof res.data === 'string' ? res.data : String(res.data || '');

  if (status >= 400) {
    throw new Error('HTTP ' + status + ' saat mengambil ' + url);
  }
  if (!html || html.length < 500) {
    throw new Error('Konten halaman kosong/terlalu pendek (' + html.length + ' byte) dari ' + url);
  }

  const $ = cheerio.load(html);
  const blocks = extractJsonLd($);
  const un = unescapeNextPayload(html);
  const payload = {};

  // Ambil namespace i18n yang relevan dari payload Next.js.
  for (const key of [
    'QualityRestoration', 'Home', 'CloudStorage', 'CloudQuota', 'PriorityQueue',
    'SegmentLimit', 'BatchLimit', 'Meidou', 'VideoAssets', 'MultiDevice',
  ]) {
    const obj = extractObjectByKey(un, key);
    if (obj) payload[key] = obj;
  }

  const title = $('title').first().text().trim() || null;
  const description = $('meta[name="description"]').attr('content') || null;
  const canonical = $('link[rel="canonical"]').attr('href') || null;
  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDesc = $('meta[property="og:description"]').attr('content') || null;

  const website = findWebsite(blocks);
  const faq = findFaq(blocks);
  const processSteps = findHowTo(blocks);
  const featureSections = extractFeatureSections($);
  const related = extractRelated($);
  const sceneModes = deriveSceneModes(payload);

  // Batas & format (dari payload i18n, apa adanya + template).
  const home = payload.Home || {};
  const benefitsRows = (home.Benefits && home.Benefits.Rows) || {};
  const planLimits = keysToPlan(benefitsRows, [
    'CloudStorage', 'CloudQuota', 'PriorityQueue', 'SegmentLimit', 'BatchLimit', 'Meidou',
    'VideoAssets', 'MultiDevice',
  ]);

  const templateKeys = ['ImageMaxResolution', 'ImageMaxResolutionInclusive', 'ImageMaxSize',
    'ImageOnly', 'VideoOnly', 'SingleOnly', 'BatchOnly', 'UnsupportedFormat'];
  const documentedTemplates = findStrings(un, templateKeys);
  const uploadRef = findStrings(un, ['UploadRefImageDesc', 'RefImageSizeTip', 'RefImageFormatTip',
    'RefImageAspectRatioTip', 'RefImageMinResolutionTip', 'RefImageMaxResolutionTip']);

  const data = {
    scraped_at: new Date().toISOString(),
    source: {
      site: DEFAULTS.site,
      feature_page: url,
      canonical: canonical,
      http_status: status,
      method: 'axios + cheerio (SSR HTML: JSON-LD + heading/paragraf + payload i18n Next.js)',
      note: 'URL fitur resmi Image Enhancer: ' + DEFAULTS.site + '/image-enhancer',
    },
    feature: {
      name: 'Wink AI Image Enhancer',
      title: title,
      og_title: ogTitle,
      description: description,
      og_description: ogDesc,
      publisher: website && website.name ? website.name : null,
      official_url: DEFAULTS.site + '/image-enhancer',
      upload_url: DEFAULTS.site + '/image-enhancer/upload',
      app_variants: {
        product: DEFAULTS.site + '/image-enhancer/upload?variant=product',
      },
    },
    modes: {
      primary: PRIMARY_MODES,
      scene_based: sceneModes,
      raw_cards: (payload.QualityRestoration && payload.QualityRestoration.Cards) || null,
      cards_title: (payload.QualityRestoration && payload.QualityRestoration.Title) || null,
    },
    mode_differences: buildModeDifferences(),
    quality_settings: {
      enhancement_strength: {
        available: true,
        description: 'Kekuatan enhancement dapat diatur (increase sharpness untuk gambar lembut, atau lembut untuk portrait) agar hasil natural.',
        web_slider_supported: false,
        web_note: findStrings(un, ['SliderNotWeb']),
        intensity_label: findStrings(un, ['Intensity']),
      },
      scene_detection: {
        available: true,
        description: 'Deteksi adegan otomatis (portrait, konser, produk, teks) sehingga tiap jenis gambar mendapat penanganan sesuai.',
      },
      available_levels: PRIMARY_MODES.map((m) => m.name),
    },
    supported_formats: {
      image_enhancer_documented: null,
      note: 'Halaman Image Enhancer tidak mempublikasikan daftar format gambar secara eksplisit.',
      documented_elsewhere: {
        scope: 'AI Image Generator – reference image (payload i18n)',
        formats: deriveFormats(uploadRef),
        max_size: extractPhrase(uploadRef.UploadRefImageDesc, /up to ([\d.]+\s*[KMG]B)/i),
        min_resolution: extractPhrase(uploadRef.RefImageMinResolutionTip, /minimum resolution of ([\d]+\s*px)/i),
        max_resolution: extractPhrase(uploadRef.RefImageMaxResolutionTip, /maximum resolution of ([\d]+\s*px)/i),
        aspect_ratio: extractPhrase(uploadRef.RefImageAspectRatioTip, /between ([\d:]+ and [\d:]+)/i),
      },
    },
    file_limits: {
      max_resolution: 'didukung hingga 4K (pernyataan FAQ)',
      max_file_size: null,
      max_file_size_note: 'Template i18n "ImageMaxSize":"Supports images up to {size}" ada, tetapi nilai size tidak dipublikasikan di halaman.',
      documented_templates: documentedTemplates,
    },
    plan_limits: planLimits,
    process: {
      steps: processSteps,
      summary: 'Unggah gambar -> pilih mode peningkatan (HD / Ultra HD / AI UHD atau mode skenario) -> proses -> lihat hasil -> unduh.',
    },
    faq: faq,
    feature_sections: featureSections,
    related_features: opts.related ? related : related.slice(0, 12),
    related_features_total: related.length,
    technical: {
      engine: 'Deep learning (dilatih pada jutaan gambar); memperkirakan & merekonstruksi detail yang hilang, menyesuaikan kontras dan noise.',
      watermark: 'Gambar hasil ekspor tanpa watermark untuk pengguna gratis (pernyataan FAQ).',
      upscaling: 'AI UHD memperbesar 2–3× tanpa tepi bergerigi; mendukung gambar hingga 4K.',
      batch: 'Mendukung unggah batch untuk memproses banyak gambar sekaligus.',
    },
    counts: {
      faq: faq.length,
      process_steps: processSteps.length,
      feature_sections: featureSections.length,
      related_features: related.length,
      scene_modes: sceneModes.length,
    },
  };

  return data;
}

function buildModeDifferences() {
  return [
    {
      aspect: 'Tingkat restorasi',
      HD: 'Penajaman & kejernihan standar',
      'Ultra HD': 'Restorasi + penajaman, rekomendasi umum',
      'AI UHD': 'Advanced Restoration 3.0 (AI mengisi detail yang hilang)',
    },
    {
      aspect: 'Perbesaran (upscale)',
      HD: 'Upscale ke HD',
      'Ultra HD': 'Upscale hingga Ultra HD/4K',
      'AI UHD': '2–3× dari input',
    },
    {
      aspect: 'Tingkatan biaya',
      HD: 'Gratis',
      'Ultra HD': 'Gratis (direkomendasikan)',
      'AI UHD': 'Premium (di luar kuota cloud gratis)',
    },
    {
      aspect: 'Cocok untuk',
      HD: 'Gambar buram ringan, butuh ketajaman dasar',
      'Ultra HD': 'Peningkatan umum foto resolusi rendah',
      'AI UHD': 'Screenshot/foto resolusi sangat rendah yang perlu detail & perbesaran',
    },
  ];
}

function findStrings(un, keys) {
  const out = {};
  for (const k of keys) {
    const m = un.match(new RegExp('"' + k + '":"((?:[^"\\\\]|\\\\.)*)"'));
    if (m) { try { out[k] = JSON.parse('"' + m[1] + '"'); } catch (_) { out[k] = m[1]; } }
  }
  return out;
}

function extractPhrase(str, re) {
  if (!str) return null;
  const m = String(str).match(re);
  return m ? m[1] : null;
}

function deriveFormats(uploadRef) {
  const text = (uploadRef && (uploadRef.UploadRefImageDesc || uploadRef.RefImageFormatTip)) || '';
  const set = [];
  for (const f of ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'BMP']) {
    if (new RegExp('\\b' + f + '\\b', 'i').test(text)) set.push(f);
  }
  return set.length ? set : null;
}

// ----------------------------- analisa gambar -----------------------------
function detectFormat(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'JPEG';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'PNG';
  if (buf.slice(0, 3).toString('ascii') === 'GIF') return 'GIF';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'WEBP';
  if (buf[0] === 0x42 && buf[1] === 0x4d) return 'BMP';
  return null;
}

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

function dimensions(buf, fmt) {
  try {
    if (fmt === 'PNG') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    if (fmt === 'GIF') return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    if (fmt === 'BMP') return { width: buf.readInt32LE(18), height: Math.abs(buf.readInt32LE(22)) };
    if (fmt === 'JPEG') return jpegSize(buf);
    if (fmt === 'WEBP') {
      const type = buf.slice(12, 16).toString('ascii');
      if (type === 'VP8X') {
        const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
        const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
        return { width: w, height: h };
      }
      if (type === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      if (type === 'VP8L') {
        const b = buf.readUInt32LE(21);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
    }
  } catch (_) {}
  return { width: null, height: null };
}

// Decoder PNG minimal (8-bit, color type 0/2/4/6) untuk analisa piksel.
function decodePng(buf) {
  let pos = 8, width, height, bitDepth, colorType;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error('PNG bit depth ' + bitDepth + ' tidak didukung');
  const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 6 ? 4 : 0;
  if (!channels) throw new Error('PNG color type ' + colorType + ' tidak didukung');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.slice(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
      cur[x] = v;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { width, height, channels, data: out };
}

function grayscale(img) {
  const { width, height, channels, data } = img;
  const g = new Float64Array(width * height);
  for (let i = 0, p = 0; i < g.length; i++, p += channels) {
    if (channels >= 3) g[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    else g[i] = data[p];
  }
  return g;
}

function analyzePixels(img) {
  const g = grayscale(img);
  const w = img.width, h = img.height;
  let sum = 0, sum2 = 0;
  for (let i = 0; i < g.length; i++) { sum += g[i]; sum2 += g[i] * g[i]; }
  const mean = sum / g.length;
  const variance = Math.max(0, sum2 / g.length - mean * mean);
  // Variansi Laplacian: metrik ketajaman/blur klasik.
  // Sampling bertahap agar gambar besar (mis. 4K) tetap cepat diproses.
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 1500000)));
  let lapSum = 0, lapSum2 = 0, n = 0;
  const k = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  for (let y = 1; y < h - 1; y += step) {
    for (let x = 1; x < w - 1; x += step) {
      let acc = 0, ki = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) acc += g[(y + dy) * w + (x + dx)] * k[ki++];
      lapSum += acc; lapSum2 += acc * acc; n++;
    }
  }
  const lapMean = n ? lapSum / n : 0;
  const lapVar = n ? Math.max(0, lapSum2 / n - lapMean * lapMean) : 0;
  return {
    width: w, height: h,
    brightness_mean: +mean.toFixed(2),
    contrast_stddev: +Math.sqrt(variance).toFixed(2),
    sharpness_laplacian_variance: +lapVar.toFixed(2),
  };
}

function qualityClass(m) {
  const mp = (m.width * m.height) / 1e6;
  if (m.sharpness_laplacian_variance >= 200 && mp >= 1) return 'high';
  if (m.sharpness_laplacian_variance >= 50 || mp >= 0.5) return 'medium';
  return 'low';
}

function evaluateMode(modeId, metrics) {
  const m = normalizeMode(modeId);
  const reasons = [];
  const blurry = metrics.sharpness_laplacian_variance < 50;
  const veryLowRes = metrics.width < 640 || metrics.height < 480;
  const lowRes = metrics.width < 1280 || metrics.height < 720;
  const isPortrait = metrics.height / metrics.width > 1.25;

  let recommended;
  if (veryLowRes || blurry) recommended = 'AI UHD';
  else if (lowRes) recommended = 'Ultra HD';
  else recommended = 'HD';

  if (veryLowRes) reasons.push('Resolusi sangat rendah (<640×480) — perlu rekonstruksi detail.');
  else if (lowRes) reasons.push('Resolusi di bawah HD — cocok dinaikkan ke Ultra HD.');
  else reasons.push('Resolusi sudah memadai; peningkatan ketajaman sudah cukup.');
  if (blurry) reasons.push('Metrik ketajaman rendah (Laplacian variance < 50) — gambar cenderung buram.');
  else reasons.push('Metrik ketajaman memadai.');
  if (isPortrait) reasons.push('Orientasi portrait terdeteksi.');

  const selected = m || normalizeMode('Ultra HD');
  return {
    selected_mode: selected.id,
    selected_mode_detail: selected,
    recommended_mode: recommended,
    recommendation_reasons: reasons,
    flag_match: m ? (m.id === recommended) : null,
    expected_effect: {
      HD: 'Penajaman & kejernihan standar, upscale ke HD.',
      'Ultra HD': 'Restorasi + penajaman, upscale hingga Ultra HD/4K.',
      'AI UHD': 'Advanced Restoration 3.0, AI mengisi detail, perbesar 2–3×.',
    }[recommended],
    target_output_resolution: {
      HD: 'HD (kelas 720p–1080p)',
      'Ultra HD': 'Ultra HD / 4K (kelas 3840×2160)',
      'AI UHD': '2–3× dari input',
    }[recommended],
  };
}

async function analyzeBuffer(buf, meta) {
  const fmt = detectFormat(buf);
  const dim = dimensions(buf, fmt);
  const size = buf.length;
  const result = {
    format: fmt,
    width: dim.width,
    height: dim.height,
    aspect_ratio: dim.width && dim.height ? +(dim.width / dim.height).toFixed(3) : null,
    megapixels: dim.width && dim.height ? +((dim.width * dim.height) / 1e6).toFixed(2) : null,
    file_size_bytes: size,
    file_size_human: humanBytes(size),
    content_type: meta && meta.contentType ? meta.contentType : null,
  };

  let metrics = null;
  try {
    if (fmt === 'JPEG' && jpegJs) {
      const dec = jpegJs.decode(buf, { useTArray: true, maxMemoryUsageInMB: 512 });
      metrics = analyzePixels({ width: dec.width, height: dec.height, channels: 4, data: dec.data });
    } else if (fmt === 'PNG') {
      metrics = analyzePixels(decodePng(buf));
    }
  } catch (e) {
    result.pixel_analysis_error = e.message;
  }

  result.pixel_metrics = metrics;
  result.pixel_analysis_available = !!metrics;
  if (!metrics && fmt === 'JPEG' && !jpegJs) result.pixel_analysis_note = 'Modul jpeg-js tidak tersedia (opsional).';
  if (!metrics && !['JPEG', 'PNG'].includes(fmt)) result.pixel_analysis_note = 'Analisa piksel ketajaman hanya untuk JPEG/PNG.';
  result.quality_class = metrics ? qualityClass(metrics) : null;
  result.is_blurry = metrics ? metrics.sharpness_laplacian_variance < 50 : null;
  return result;
}

// ----------------------------- mode uji kualitas -----------------------------
async function qualityTestGet(imageUrl, modeId, opts) {
  const res = await httpGet(imageUrl, {
    responseType: 'arraybuffer',
    timeout: opts.timeout,
    retries: opts.retries,
    headers: { Accept: 'image/*,*/*' },
  });
  const buf = Buffer.from(res.data);
  const info = await analyzeBuffer(buf, { contentType: res.headers['content-type'] });
  const metrics = info.pixel_metrics || { width: info.width, height: info.height, sharpness_laplacian_variance: null };
  const evaluation = evaluateMode(modeId, {
    width: info.width || 0, height: info.height || 0,
    sharpness_laplacian_variance: metrics.sharpness_laplacian_variance == null ? 100 : metrics.sharpness_laplacian_variance,
  });

  // Simpan gambar SUMBER yang diunduh ke lokal (bukan hasil enhancer AI).
  // Aktif bila --save (nama otomatis) atau --save-image[=PATH] diberikan.
  const wantImage = (opts.save || opts.saveImage) && res.status < 400 && buf.length;
  if (wantImage) {
    const target = (opts.saveImage && opts.saveImage !== 'AUTO') ? opts.saveImage : autoImageName(info.format);
    try {
      fs.writeFileSync(target, buf);
      info.saved_to = path.resolve(target);
      info.saved_bytes = buf.length;
      console.error(dim('[i] Gambar tersimpan: ' + path.resolve(target)));
    } catch (e) {
      info.save_error = e.message;
    }
  }
  // --embed : sisipkan gambar sebagai base64 data-URI ke dalam JSON.
  if (opts.embed && buf.length) {
    info.data_uri = 'data:' + (info.content_type || 'application/octet-stream') + ';base64,' + buf.toString('base64');
  }

  const warnings = [];
  if (res.status >= 400) warnings.push('HTTP ' + res.status + ' saat mengunduh gambar; data mungkin tidak valid.');
  if (!info.format) warnings.push('Format gambar tidak dikenali (bukan JPEG/PNG/GIF/WEBP/BMP).');
  if (info.format && (info.width == null || info.height == null)) warnings.push('Dimensi gambar tidak dapat dibaca.');

  return {
    mode: 'quality_test',
    method: 'GET',
    ok: res.status < 400 && !!info.format,
    request: { url: imageUrl, http_status: res.status, selected_mode: (normalizeMode(modeId) || {}).id || modeId },
    warnings: warnings,
    image: info,
    mode_evaluation: evaluation,
    note: 'Analisa dijalankan lokal pada gambar yang diunduh. Scraper tidak memanggil API peningkatan privat Wink (butuh autentikasi).',
  };
}

async function qualityTestPost(imageUrl, modeId, opts) {
  const base = await qualityTestGet(imageUrl, modeId, opts);
  if (!opts.endpoint) {
    base.post = {
      attempted: false,
      reason: 'Tidak ada --endpoint. POST dilewati; hasil GET di atas tetap valid.',
    };
    base.method = 'GET';
    return base;
  }
  const res = await httpGet(imageUrl, { responseType: 'arraybuffer', timeout: opts.timeout, retries: opts.retries, headers: { Accept: 'image/*' } });
  const buf = Buffer.from(res.data);
  const contentType = res.headers['content-type'] || 'application/octet-stream';
  try {
    const post = await axios.post(opts.endpoint, buf, {
      timeout: opts.timeout,
      maxRedirects: DEFAULTS.maxRedirects,
      validateStatus: () => true,
      headers: { 'Content-Type': contentType, 'Content-Length': buf.length, 'User-Agent': DEFAULTS.userAgent },
    });
    base.method = 'GET+POST';
    base.post = {
      attempted: true,
      endpoint: opts.endpoint,
      http_status: post.status,
      response_content_type: post.headers['content-type'] || null,
      response: typeof post.data === 'string' ? post.data.slice(0, 2000) : post.data,
    };
  } catch (e) {
    base.method = 'GET+POST';
    base.post = { attempted: true, endpoint: opts.endpoint, error: e.message };
  }
  return base;
}

async function qualityTestFile(file, modeId, opts) {
  if (!fs.existsSync(file)) throw new Error('File tidak ditemukan: ' + file);
  const buf = fs.readFileSync(file);
  const info = await analyzeBuffer(buf, { contentType: null });
  const metrics = info.pixel_metrics || { sharpness_laplacian_variance: null };
  const evaluation = evaluateMode(modeId, {
    width: info.width || 0, height: info.height || 0,
    sharpness_laplacian_variance: metrics.sharpness_laplacian_variance == null ? 100 : metrics.sharpness_laplacian_variance,
  });
  return {
    mode: 'quality_test',
    method: 'LOCAL',
    ok: !!info.format,
    request: { file: path.resolve(file), selected_mode: (normalizeMode(modeId) || {}).id || modeId },
    image: info,
    mode_evaluation: evaluation,
    note: 'Analisa file lokal (tanpa jaringan).',
  };
}

// ----------------------------- CLI -----------------------------
function parseArgs(argv) {
  const opts = {
    page: null, imageUrl: null, mode: null, post: false, endpoint: null,
    file: null,     out: DEFAULTS.out, outExplicit: false, retries: DEFAULTS.retries, timeout: DEFAULTS.timeout,
    related: false, help: false, save: false, saveImage: null, embed: false,
  };
  const words = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--post') opts.post = true;
    else if (a === '--related') opts.related = true;
    else if (a === '--save') opts.save = true;
    else if (a === '--embed') opts.embed = true;
    else if (a === '--save-image') opts.saveImage = 'AUTO';
    else if (a.startsWith('--save-image=')) opts.saveImage = a.slice(13);
    else if (a.startsWith('--url=')) opts.page = a.slice(6);
    else if (a.startsWith('--out=')) { opts.out = a.slice(6); opts.outExplicit = true; }
    else if (a.startsWith('--file=')) opts.file = a.slice(7);
    else if (a.startsWith('--retries=')) opts.retries = parseInt(a.slice(10), 10);
    else if (a.startsWith('--timeout=')) opts.timeout = parseInt(a.slice(10), 10);
    else if (a.startsWith('--endpoint=')) opts.endpoint = a.slice(11);
    else if (a.startsWith('--mode=')) opts.mode = a.slice(7);
    else if (a === '--mode') { opts.mode = argv[++i]; }
    else if (a === '--Ultra') { opts.mode = 'Ultra HD'; if (/^HD$/i.test(argv[i + 1] || '')) i++; }
    else if (/^--(HD|Ultra HD|UHD|uhd|hd|aiuhd|AI UHD|AI-UHD)$/i.test(a)) opts.mode = a.slice(2);
    else if (a.startsWith('--')) continue;
    else words.push(a);
  }
  if (words[0]) {
    if (/^https?:\/\//i.test(words[0])) opts.imageUrl = words[0];
    else if (!opts.file) opts.file = words[0];
  }
  if (!opts.mode && words[1]) {
    // tangani "node scrape-wink.js <url> HD / Ultra HD / UHD" tanpa tanda --
    const m = normalizeMode(words.slice(1).join(' '));
    if (m) opts.mode = m.id;
  }
  return opts;
}

function usage() {
  console.log(bold('scrape-wink.js — Scraper Wink AI Image Enhancer + uji kualitas gambar'));
  console.log('');
  console.log(bold('1) Scrape metadata fitur (default):'));
  console.log('   ' + cyan('node scrape-wink.js') + dim('   # tulis wink-image-enhancer.json + cetak JSON'));
  console.log('   ' + cyan('node scrape-wink.js --url=https://wink.ai/image-enhancer --related'));
  console.log('');
  console.log(bold('2) Uji kualitas gambar via HTTP GET:'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --HD'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --Ultra HD'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --UHD'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --mode="Ultra HD"'));
  console.log('');
  console.log(bold('3) Uji via HTTP POST (kirim gambar ke endpoint):'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --mode=UHD --post --endpoint=https://host/api'));
  console.log('');
  console.log(bold('4) Uji file lokal:'));
  console.log('   ' + cyan('node scrape-wink.js --file=foto.png --mode=UHD'));
  console.log('');
  console.log(bold('5) Simpan gambar sumber ke lokal / embed base64:'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --HD --save') + dim('            # nama otomatis wink-<tanggal>.jpg'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --HD --save-image=hasil.jpg'));
  console.log('   ' + cyan('node scrape-wink.js "https://image.url.jpg" --HD --save --embed') + dim('    # + base64 di JSON'));
  console.log('');
  console.log('Opsi: ' + dim('--out=file.json  --save  --save-image=out.jpg  --embed  --retries=3  --timeout=30000  --related'));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) { usage(); return; }

  // Mode uji kualitas gambar
  if (opts.file || opts.imageUrl) {
    let result;
    if (opts.file) {
      result = await qualityTestFile(opts.file, opts.mode, opts);
    } else if (opts.post) {
      result = await qualityTestPost(opts.imageUrl, opts.mode, opts);
    } else {
      result = await qualityTestGet(opts.imageUrl, opts.mode, opts);
    }
    const json = JSON.stringify(result, null, 2);
    console.log(json);
    if (opts.save || opts.outExplicit) {
      const f = opts.outExplicit
        ? opts.out
        : (opts.file ? 'wink-quality-' + path.basename(opts.file) + '.json' : 'wink-quality.json');
      try { fs.writeFileSync(f, json); console.error(dim('[i] Hasil disimpan: ' + path.resolve(f))); } catch (_) {}
    }
    return;
  }

  // Mode scrape metadata (default)
  console.error(dim('[i] Scraping metadata: ' + (opts.page || DEFAULTS.page)));
  const data = await scrapeMetadata(opts.page, opts);
  const json = JSON.stringify(data, null, 2);
  console.log(json);
  try {
    fs.writeFileSync(opts.out, json);
    console.error(dim('[i] Disimpan ke: ' + path.resolve(opts.out)));
  } catch (e) {
    console.error(yellow('[!] Gagal menulis file: ' + e.message));
  }
  console.error(
    green('[✓] Selesai') + dim(
      '  modes: ' + data.modes.primary.length + ' primer / ' + data.modes.scene_based.length + ' skenario' +
      '  faq: ' + data.counts.faq + '  langkah: ' + data.counts.process_steps +
      '  fitur terkait: ' + data.counts.related_features
    )
  );
}

if (require.main === module) {
  main().catch((e) => {
    const msg = (e && (e.stack || e.message)) || String(e);
    console.error(red('FATAL: ' + msg));
    // Tetap keluarkan JSON error agar downstream tidak menerima output kosong.
    if (process.argv.slice(2).some((a) => a.startsWith('--json'))) {
      console.log(JSON.stringify({ ok: false, error: e.message }, null, 2));
    }
    process.exit(1);
  });
}

module.exports = { scrapeMetadata, normalizeMode, PRIMARY_MODES, parseArgs, detectFormat, dimensions, analyzeBuffer, evaluateMode };