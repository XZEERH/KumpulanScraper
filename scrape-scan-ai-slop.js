#!/usr/bin/env node
'use strict';

/**
 * Name : hivedetect.ai (berfungsi menganalisa ai slop lewat upload image).
 * Owner : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base web : https://hivedetect.ai
 * Type : Scraper
 * Description : intinya analisa gambar kalian apakah dari ai slop atau enggak dengan beberapa model yang tersedia, cocok untuk analisa web apakah slop ai atau enggak.
 * Note : form-data hanya dipakai sebagai fallback node <18. pada node 18+ script otomatis memakai FormData/Blob bawaan. Btw error fix sendiri.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const TARGET_URL = 'https://hivedetect.ai/';
const API_HOST = 'https://hivedetect.ai/';
const UPLOAD_URL = API_HOST + 'api/v1/upload';
const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
const REQUEST_TIMEOUT = 60000;
const RESULT_TIMEOUT = 180000;
const POLL_INTERVAL = 3000;
const UPLOAD_RETRIES = 3;

const EXT_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', bmp: 'image/bmp', tif: 'image/tiff', tiff: 'image/tiff',
  mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v', webm: 'video/webm',
  mkv: 'video/x-matroska', avi: 'video/x-msvideo', wmv: 'video/x-ms-wmv', mpeg: 'video/mpeg', mpg: 'video/mpeg',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
  m4a: 'audio/x-m4a', aac: 'audio/aac', opus: 'audio/opus', weba: 'audio/webm'
};

const NON_MODEL_CLASSES = new Set([
  'ai_generated', 'not_ai_generated', 'deepfake', 'none', 'inconclusive',
  'inconclusive_video', 'ai_generated_music', 'not_ai_generated_music',
  'ai_generated_music_vocal', 'not_ai_generated_music_vocal'
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mean(arr) {
  const v = arr.filter((x) => typeof x === 'number' && !Number.isNaN(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function classMap(classes) {
  const m = {};
  for (const c of classes || []) {
    if (c && c.class != null) m[c.class] = c.score;
  }
  return m;
}

function verdict(scores, a, b) {
  const hasA = typeof scores[a] === 'number';
  const hasB = typeof scores[b] === 'number';
  if (hasA && hasB) return scores[a] >= scores[b] ? a : b;
  if (hasA) return a;
  if (hasB) return b;
  return null;
}

function generatorScores(list, limit) {
  const out = (list || [])
    .filter((c) => c && !NON_MODEL_CLASSES.has(c.class) && typeof c.score === 'number' && c.score > 0)
    .map((c) => ({ model: c.class, score: c.score }))
    .sort((a, b) => b.score - a.score);
  return typeof limit === 'number' ? out.slice(0, limit) : out;
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  return EXT_MIME[ext] || 'application/octet-stream';
}

function mediaKindFromMime(mime, fallbackType) {
  if (mime && mime.startsWith('video/')) return 'video';
  if (mime && mime.startsWith('audio/')) return 'audio';
  if (mime && mime.startsWith('image/')) return 'image';
  if (fallbackType === 'VIDEO') return 'video';
  if (fallbackType === 'AUDIO') return 'audio';
  if (fallbackType === 'PHOTO') return 'image';
  return 'unknown';
}

async function fetchText(url, timeout = REQUEST_TIMEOUT) {
  const res = await axios.get(url, {
    timeout,
    responseType: 'text',
    transformResponse: [(d) => d],
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  return typeof res.data === 'string' ? res.data : String(res.data);
}

function makeForm() {
  if (typeof FormData !== 'undefined' && typeof Blob !== 'undefined') {
    return { type: 'native', form: new FormData() };
  }
  const PkgFormData = require('form-data');
  return { type: 'pkg', form: new PkgFormData() };
}

async function uploadMedia({ mediaUrl, filePath }) {
  let attempt = 0;
  let lastErr = null;
  while (attempt < UPLOAD_RETRIES) {
    attempt += 1;
    try {
      const { type, form } = makeForm();
      const headers = { 'User-Agent': USER_AGENT, Origin: TARGET_URL.replace(/\/$/, ''), Referer: TARGET_URL };

      if (mediaUrl) {
        form.append('media_url', mediaUrl);
      } else {
        const buf = fs.readFileSync(filePath);
        const mime = mimeFor(filePath);
        const filename = path.basename(filePath);
        if (type === 'native') {
          form.append('media', new Blob([buf], { type: mime }), filename);
        } else {
          form.append('media', buf, { filename, contentType: mime, knownLength: buf.length });
          Object.assign(headers, form.getHeaders());
        }
      }

      const res = await axios.post(UPLOAD_URL, form, {
        timeout: RESULT_TIMEOUT,
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        withCredentials: true,
        validateStatus: (s) => s >= 200 && s < 500
      });

      if (res.status === 429) {
        await sleep(2000 * attempt);
        lastErr = new Error('Rate limited (429)');
        continue;
      }
      const shortKey = res.data && res.data.data && res.data.data.short_key;
      if (!shortKey) {
        const msg = (res.data && (res.data.message || res.data.error)) || ('HTTP ' + res.status);
        throw new Error('Upload gagal: ' + msg);
      }
      return shortKey;
    } catch (e) {
      lastErr = e;
      const status = e.response && e.response.status;
      if (status && status >= 500) {
        await sleep(1500 * attempt);
        continue;
      }
      break;
    }
  }
  throw lastErr || new Error('Upload gagal tanpa detail');
}

function isResultReady(d) {
  if (!d || typeof d !== 'object') return false;
  for (const key of ['visual', 'audio', 'music']) {
    const c = d[key];
    if (!c) continue;
    if (c.message && c.return_code) return true;
    if (Array.isArray(c.status)) {
      for (const s of c.status) {
        if (s && s.response && Array.isArray(s.response.output) && s.response.output.length) return true;
      }
    }
  }
  return false;
}

async function fetchResult(shortKey) {
  const url = API_HOST + 'json/' + shortKey + '.json';
  const deadline = Date.now() + RESULT_TIMEOUT;
  let last = null;
  while (true) {
    try {
      const res = await axios.get(url, {
        timeout: 30000,
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', Referer: TARGET_URL }
      });
      last = res.data;
      if (isResultReady(last)) return last;
    } catch (e) {
      if (last === null) last = null;
    }
    if (Date.now() >= deadline) break;
    await sleep(POLL_INTERVAL);
  }
  if (last) return last;
  throw new Error('Hasil tidak tersedia (timeout polling) untuk result id ' + shortKey);
}

function componentRecords(component) {
  if (!component || !Array.isArray(component.status)) return [];
  return component.status.map((s) => s && s.response).filter(Boolean);
}

function segmentize(component) {
  const records = componentRecords(component);
  if (!records.length) return { input: {}, segments: [] };
  const input = records[0].input || {};
  const segments = [];
  let idx = 0;
  for (const rec of records) {
    for (const out of rec.output || []) {
      segments.push({
        index: idx++,
        timestamp: out.time != null ? out.time : null,
        end_time: out.end_time != null ? out.end_time : null,
        classes: classMap(out.classes),
        content_credentials: out.algorithmic_tags || null
      });
    }
  }
  return { input, segments };
}

function emptyCredentials(tags) {
  if (!tags) return true;
  const flat = [];
  const walk = (o) => {
    for (const k of Object.keys(o || {})) {
      const v = o[k];
      if (v && typeof v === 'object') walk(v);
      else if (v !== '' && v != null) flat.push(v);
    }
  };
  walk(tags);
  return flat.length === 0;
}

function aggregateModelScores(segments, limit = 15) {
  const totals = {};
  for (const seg of segments) {
    for (const [name, score] of Object.entries(seg.classes)) {
      if (NON_MODEL_CLASSES.has(name) || typeof score !== 'number' || score <= 0) continue;
      totals[name] = (totals[name] || 0) + score;
    }
  }
  const n = segments.length || 1;
  return Object.entries(totals)
    .map(([model, sum]) => ({ model, score: sum / n }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function buildVisual(component) {
  if (!component) return null;
  if (component.message && component.return_code) {
    return { available: false, error: true, message: component.message, return_code: component.return_code };
  }
  const { input, segments } = segmentize(component);
  if (!segments.length) return { available: false, error: true, message: 'Tidak ada output visual' };

  const media = input.media || {};
  const frames = segments.map((seg) => ({
    timestamp: seg.timestamp,
    frame_index: seg.index,
    frame_ai_score: typeof seg.classes.ai_generated === 'number' ? seg.classes.ai_generated : null,
    frame_deepfake_score: typeof seg.classes.deepfake === 'number' ? seg.classes.deepfake : null,
    frame_not_ai_generated_score:
      typeof seg.classes.not_ai_generated === 'number' ? seg.classes.not_ai_generated : null,
    frame_classification: verdict(seg.classes, 'ai_generated', 'not_ai_generated'),
    model: input.model || null,
    model_scores: generatorScores(
      Object.entries(seg.classes).map(([c, score]) => ({ class: c, score })),
      10
    ),
    content_credentials: seg.content_credentials || null
  }));

  const aiScores = frames.map((f) => f.frame_ai_score);
  const notScores = frames.map((f) => f.frame_not_ai_generated_score);
  const meanAi = mean(aiScores);
  const meanNot = mean(notScores);
  const nonEmptyCreds =
    segments.map((s) => s.content_credentials).find((c) => c && !emptyCredentials(c)) ||
    (segments[0] ? segments[0].content_credentials : null);

  return {
    available: true,
    error: false,
    media_type: mediaKindFromMime(media.mimetype, media.type),
    extension: media.mime_type || null,
    media,
    detection_model: input.model || null,
    model_type: input.model_type || null,
    model_version: input.model_version != null ? input.model_version : null,
    ai_generated_score: meanAi,
    ai_generated_score_max: aiScores.filter((x) => typeof x === 'number').length
      ? Math.max(...aiScores.filter((x) => typeof x === 'number'))
      : null,
    deepfake_score: mean(frames.map((f) => f.frame_deepfake_score)),
    classification: verdict({ ai_generated: meanAi, not_ai_generated: meanNot }, 'ai_generated', 'not_ai_generated'),
    classification_scores: { ai_generated: meanAi, not_ai_generated: meanNot },
    content_credentials: nonEmptyCreds,
    top_generator_models: aggregateModelScores(segments),
    frames
  };
}

function buildSpeech(component) {
  if (!component) return null;
  if (component.message && component.return_code) {
    return { available: false, error: true, message: component.message, return_code: component.return_code };
  }
  const { input, segments } = segmentize(component);
  if (!segments.length) return { available: false, error: true, message: 'Tidak ada output audio' };
  const segs = segments.map((seg) => ({
    timestamp: seg.timestamp,
    end_time: seg.end_time,
    speech_ai_score: typeof seg.classes.ai_generated === 'number' ? seg.classes.ai_generated : null,
    not_ai_generated_score:
      typeof seg.classes.not_ai_generated === 'number' ? seg.classes.not_ai_generated : null,
    classification: verdict(seg.classes, 'ai_generated', 'not_ai_generated')
  }));
  const meanAi = mean(segs.map((s) => s.speech_ai_score));
  const meanNot = mean(segs.map((s) => s.not_ai_generated_score));
  return {
    available: true,
    error: false,
    detection_model: input.model || null,
    ai_generated_score: meanAi,
    classification: verdict({ ai_generated: meanAi, not_ai_generated: meanNot }, 'ai_generated', 'not_ai_generated'),
    classification_scores: { ai_generated: meanAi, not_ai_generated: meanNot },
    segments: segs
  };
}

function buildMusic(component) {
  if (!component) return null;
  if (component.message && component.return_code) {
    return { available: false, error: true, message: component.message, return_code: component.return_code };
  }
  const { input, segments } = segmentize(component);
  if (!segments.length) return { available: false, error: true, message: 'Tidak ada output musik' };
  const segs = segments.map((seg) => ({
    timestamp: seg.timestamp,
    end_time: seg.end_time,
    ai_generated_music_score:
      typeof seg.classes.ai_generated_music === 'number' ? seg.classes.ai_generated_music : null,
    not_ai_generated_music_score:
      typeof seg.classes.not_ai_generated_music === 'number' ? seg.classes.not_ai_generated_music : null,
    ai_generated_music_vocal_score:
      typeof seg.classes.ai_generated_music_vocal === 'number' ? seg.classes.ai_generated_music_vocal : null,
    classification: verdict(seg.classes, 'ai_generated_music', 'not_ai_generated_music'),
    model_scores: generatorScores(
      Object.entries(seg.classes).map(([c, score]) => ({ class: c, score })),
      10
    )
  }));
  const meanAi = mean(segs.map((s) => s.ai_generated_music_score));
  const meanNot = mean(segs.map((s) => s.not_ai_generated_music_score));
  return {
    available: true,
    error: false,
    detection_model: input.model || null,
    ai_generated_music_score: meanAi,
    classification: verdict(
      { ai_generated_music: meanAi, not_ai_generated_music: meanNot },
      'ai_generated_music',
      'not_ai_generated_music'
    ),
    classification_scores: { ai_generated_music: meanAi, not_ai_generated_music: meanNot },
    top_generator_models: aggregateModelScores(segments, 10),
    segments: segs
  };
}

function buildDetection(raw, shortKey, inputInfo) {
  const visual = buildVisual(raw.visual);
  const speechAi = buildSpeech(raw.audio);
  const musicAi = buildMusic(raw.music);

  let mediaType = 'unknown';
  if (visual && visual.available && visual.media_type && visual.media_type !== 'unknown') {
    mediaType = visual.media_type;
  } else if (speechAi && speechAi.available) {
    mediaType = 'audio';
  } else if (musicAi && musicAi.available) {
    mediaType = 'audio';
  }

  return {
    result_id: shortKey,
    result_url: API_HOST + shortKey,
    json_url: API_HOST + 'json/' + shortKey + '.json',
    media_file_url: API_HOST + 'media/' + shortKey,
    input: inputInfo,
    extension: raw.extension || null,
    media_type: mediaType,
    ai_generated_score: visual && visual.available ? visual.ai_generated_score : null,
    ai_generated_score_max: visual && visual.available ? visual.ai_generated_score_max : null,
    deepfake_score: visual && visual.available ? visual.deepfake_score : null,
    classification: visual && visual.available ? visual.classification : null,
    classification_scores: visual && visual.available ? visual.classification_scores : null,
    content_credentials: visual && visual.available ? visual.content_credentials : null,
    model: visual && visual.available
      ? {
          detection_model: visual.detection_model,
          model_type: visual.model_type,
          model_version: visual.model_version,
          top_generator_models: visual.top_generator_models
        }
      : null,
    speech_ai: speechAi,
    music_ai: musicAi,
    frames: visual && visual.available ? visual.frames : null
  };
}

function extractModelConfig(text) {
  const start = text.indexOf('accepted_media_types:[');
  if (start < 0) return null;
  const win = text.slice(start, start + 1600);

  const fmtMatch = win.match(/accepted_media_types:\[([^\]]+)\]/);
  const format_media = fmtMatch ? [...fmtMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];

  const titleMatch = win.match(/title:"([^"]+)"/);
  const descMatch = win.match(/description:"([^"]+)"/);
  const endpointMatch = win.match(/endpoint_key:([A-Za-z0-9_$.]+)/);
  const selfServeMatch = win.match(/self_serve_model_key:([A-Za-z0-9_$.]+)/);
  const typeMatch = win.match(/type:([A-Za-z0-9_$.]+)/);
  const statusMatch = win.match(/status_format:([A-Za-z0-9_$.]+)/);
  const maxFile = win.match(/max_file_size:([A-Za-z0-9_$.]+)/);
  const maxDur = win.match(/max_duration:([A-Za-z0-9_$.]+)/);

  const kinds = new Set();
  for (const f of format_media) {
    if (f.startsWith('image/')) kinds.add('image');
    else if (f.startsWith('video/')) kinds.add('video');
    else if (f.startsWith('audio/')) kinds.add('audio');
  }

  return {
    format_media,
    fitur_deteksi: [
      {
        name: titleMatch ? titleMatch[1] : null,
        description: descMatch ? descMatch[1] : null,
        endpoint_key: endpointMatch ? endpointMatch[1] : null,
        self_serve_model_key: selfServeMatch ? selfServeMatch[1] : null,
        status_format: statusMatch ? statusMatch[1] : null,
        tipe: typeMatch ? typeMatch[1] : null,
        max_file_size: maxFile ? maxFile[1] : null,
        max_duration: maxDur ? maxDur[1] : null
      }
    ],
    jenis_input: {
      media: Array.from(kinds),
      metode: ['file_upload', 'media_url']
    }
  };
}

function resolveRef(ref, corpus) {
  if (!ref || typeof ref !== 'string') return ref;
  const seg = ref.split('.').pop();
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(seg)) return ref;
  const values = new Set();
  const re = new RegExp('\\b' + seg + '="([^"]+)"', 'g');
  for (const text of corpus) {
    let m;
    while ((m = re.exec(text))) values.add(m[1]);
  }
  return values.size === 1 ? [...values][0] : ref;
}

function resolveConfigRefs(feature, corpus) {
  if (!feature || !Array.isArray(corpus)) return feature;
  for (const key of ['endpoint_key', 'self_serve_model_key', 'status_format', 'tipe', 'max_file_size', 'max_duration']) {
    feature[key] = resolveRef(feature[key], corpus);
  }
  return feature;
}

function extractNavigation(text) {
  const defs = [
    ['Terms of Use', 'https://thehive.ai/terms-of-use', '/terms-of-use'],
    ['Privacy Policy', 'https://thehive.ai/privacy', '"/privacy"'],
    ['Ethics', 'https://thehive.ai/ethics', '/ethics'],
    ['AI-Generated Content API', 'https://thehive.ai/apis/ai-generated-content-classification', '/apis/ai-generated-content-classification'],
    ['Hive Home', 'https://thehive.ai', 'https://thehive.ai'],
    ['X (Twitter)', 'https://x.com/hive_ai', 'x.com/hive_ai'],
    ['Documentation', 'https://docs.thehive.ai', 'docs.thehive.ai'],
    ['Explore Models & APIs', 'https://thehive.ai/explore', 'thehive.ai/explore']
  ];
  const found = [];
  for (const [label, url, needle] of defs) {
    if (text.includes(needle)) found.push({ label, url });
  }
  return found;
}

async function extractSiteConfig(html) {
  const $ = cheerio.load(html);
  const scripts = [];
  $('script[src]').each((i, el) => {
    const src = $(el).attr('src');
    if (!src) return;
    try {
      scripts.push(new URL(src, TARGET_URL).href);
    } catch (e) {
      /* ignore */
    }
  });

  const priority = scripts.filter((u) => /\/(13|15|16)\./.test(u));
  const rest = scripts.filter((u) => !/\/(13|15|16)\./.test(u));
  const order = [...priority, ...rest];

  const result = { format_media: null, fitur_deteksi: null, navigasi: [], jenis_input: null };
  let configFound = false;
  let navFound = false;
  const CONC = 10;
  const corpus = [];

  for (let i = 0; i < order.length && !(configFound && navFound); i += CONC) {
    const batch = order.slice(i, i + CONC);
    const texts = await Promise.all(batch.map((u) => fetchText(u).catch(() => null)));
    for (const t of texts) {
      if (!t) continue;
      corpus.push(t);
      if (!configFound) {
        const cfg = extractModelConfig(t);
        if (cfg && cfg.format_media.length) {
          result.format_media = cfg.format_media;
          result.fitur_deteksi = cfg.fitur_deteksi;
          result.jenis_input = cfg.jenis_input;
          configFound = true;
        }
      }
      if (!navFound) {
        const nav = extractNavigation(t);
        if (nav.length >= 2) {
          result.navigasi = nav;
          navFound = true;
        }
      }
    }
  }

  if (Array.isArray(result.fitur_deteksi)) {
    for (const feature of result.fitur_deteksi) resolveConfigRefs(feature, corpus);
  }
  return result;
}

function usage() {
  process.stdout.write(
    [
      'Hive Detect scraper',
      '',
      'Penggunaan:',
      '  node scrape-hivedetect.js [media] [--out=file.json] [--no-config]',
      '',
      '  media   URL media (http/https) atau path file lokal (image/video/audio).',
      '          Kosongkan untuk hanya mengambil metadata halaman.',
      '  --out   Path output JSON (default: hivedetect-output.json)',
      '  --no-config  Lewati pemindaian bundle untuk konfigurasi situs.',
      ''
    ].join('\n')
  );
}

async function main() {
  const args = process.argv.slice(2);
  let media = null;
  let out = 'hivedetect-output.json';
  let scanConfig = true;

  for (const a of args) {
    if (a === '--help' || a === '-h') {
      usage();
      return;
    } else if (a === '--no-config') {
      scanConfig = false;
    } else if (a.startsWith('--out=')) {
      out = a.slice('--out='.length);
    } else if (!media) {
      media = a;
    }
  }

  const output = {
    scraped_at: new Date().toISOString(),
    source: {
      target_url: TARGET_URL,
      api_base: API_HOST,
      method: 'SPA reverse engineered JSON API (Axios untuk API + Cheerio untuk metadata)'
    },
    page: {
      title: null,
      description: null,
      page_url: TARGET_URL,
      fitur_deteksi: null,
      format_media: null,
      navigasi: [],
      jenis_input: null
    },
    input: null,
    detection: null,
    errors: []
  };

  process.stderr.write('[1/3] Mengambil metadata halaman ' + TARGET_URL + '\n');
  let html = '';
  try {
    html = await fetchText(TARGET_URL);
    const $ = cheerio.load(html);
    output.page.title = ($('title').first().text() || '').trim() || null;
    const desc = $('meta[name="description"]').attr('content');
    output.page.description = desc ? desc.trim() : null;
    if (!output.page.page_url) output.page.page_url = TARGET_URL;
  } catch (e) {
    output.errors.push({ stage: 'page_metadata', message: e.message });
    process.stderr.write('  gagal: ' + e.message + '\n');
  }

  if (scanConfig && html) {
    process.stderr.write('[2/3] Memindai bundle untuk fitur/format/navigasi\n');
    try {
      const cfg = await extractSiteConfig(html);
      output.page.fitur_deteksi = cfg.fitur_deteksi;
      output.page.format_media = cfg.format_media;
      output.page.navigasi = cfg.navigasi;
      output.page.jenis_input = cfg.jenis_input;
    } catch (e) {
      output.errors.push({ stage: 'site_config', message: e.message });
      process.stderr.write('  gagal: ' + e.message + '\n');
    }
  } else {
    process.stderr.write('[2/3] Pemindaian konfigurasi dilewati\n');
  }

  if (media) {
    process.stderr.write('[3/3] Mendeteksi media: ' + media + '\n');
    const isUrl = /^https?:\/\//i.test(media);
    output.input = {
      provided: media,
      method: isUrl ? 'media_url' : 'file_upload',
      path: isUrl ? null : path.resolve(media)
    };
    try {
      if (!isUrl && !fs.existsSync(media)) {
        throw new Error('File tidak ditemukan: ' + media);
      }
      const shortKey = await uploadMedia({ mediaUrl: isUrl ? media : null, filePath: isUrl ? null : media });
      process.stderr.write('  upload OK, result id: ' + shortKey + '\n');
      const raw = await fetchResult(shortKey);
      output.detection = buildDetection(raw, shortKey, output.input);
      process.stderr.write('  media_type: ' + output.detection.media_type + '\n');
      if (output.detection.ai_generated_score != null) {
        process.stderr.write('  skor AI-generated: ' + output.detection.ai_generated_score + '\n');
      }
    } catch (e) {
      const status = e.response && e.response.status;
      output.errors.push({ stage: 'detection', message: e.message, status: status || null });
      process.stderr.write('  gagal: ' + e.message + '\n');
    }
  } else {
    process.stderr.write('[3/3] Tidak ada media (mode metadata saja)\n');
  }

  const json = JSON.stringify(output, null, 2);
  try {
    fs.writeFileSync(out, json + '\n');
    process.stderr.write('Hasil disimpan: ' + path.resolve(out) + '\n');
  } catch (e) {
    output.errors.push({ stage: 'write_output', message: e.message });
  }
  process.stdout.write(json + '\n');
  if (output.errors.length && !output.detection) process.exitCode = 1;
}

process.on('SIGINT', () => process.exit(130));
main().catch((e) => {
  process.stderr.write('Fatal: ' + (e && e.stack ? e.stack : e) + '\n');
  process.exit(1);
});