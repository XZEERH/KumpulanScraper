#!/usr/bin/env node
/*
 * scrape-freeupscaler | Creator: Razeerh | 21-11-2026
 * Target: https://free.upscaler.video (WebSR, 100% client-side)
 * Scrape engine config + media metadata into a prepared upscale report.
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://free.upscaler.video';
const REPO = 'https://raw.githubusercontent.com/razeerh/upscaler-video/main/package.json';
const UA = 'Mozilla/5.0 (Linux; Android 14; Termux) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const NETWORKS = {
  small: { name: 'anime4k/cnn-2x-l', weightsUrl: '/weights/cnn-8.bin', family: 'sharpen', size: 'small' },
  medium: { name: 'anime4k/cnn-2x-16', weightsUrl: '/weights/cnn-16.bin', family: 'sharpen', size: 'medium' },
  large: { name: 'anime4k/cnn-2x-28', weightsUrl: '/weights/cnn-28.bin', family: 'sharpen', size: 'large' },
  'detail-small': { name: 'katana/unet-u24', weightsUrl: '/weights/detail-small.bin', family: 'detail', size: 'small' },
  'detail-medium': { name: 'katana/unet-u32', weightsUrl: '/weights/detail-medium.bin', family: 'detail', size: 'medium' },
  xl: { name: 'realesrgan/x4v3', weightsUrl: '/weights/realesr-x4v3.bin', family: 'sharpen', size: 'xl' },
  xs: { name: 'sr2/cnn-2x-xs', weightsUrl: '/weights/sr2-xs.bin', family: 'sharpen', size: 'xs' }
};
const DEFAULTS = {
  networkSize: 'medium', selectedResolution: '2x', outputCodec: 'avc', outputContainer: 'mp4',
  audioBitrate: 128000, bitrateBase: 2500000, bitrateRef: 921600, maxVideoDimension: 3840, maxImageDimension: 4096
};
const FALLBACK = { siteUrl: SITE, title: 'Free AI Video Upscaler', mainScript: new URL('/main.js', SITE).href, networks: NETWORKS, familyDefaults: { sharpen: 'medium', detail: 'small' }, defaults: DEFAULTS, sdkVersion: '0.0.14', source: 'fallback', weights: {} };
const VC = { avc1: 'H.264/AVC', avc3: 'H.264/AVC', hvc1: 'H.265/HEVC', hev1: 'H.265/HEVC', vp09: 'VP9', av01: 'AV1', mp4v: 'MPEG-4', 'V_MPEG4/ISO/AVC': 'H.264/AVC', 'V_MPEGH/ISO/HEVC': 'H.265/HEVC', V_VP8: 'VP8', V_VP9: 'VP9', V_AV1: 'AV1' };
const AC = { mp4a: 'AAC', Opus: 'Opus', opus: 'Opus', vorbis: 'Vorbis', 'ac-3': 'AC-3', 'ec-3': 'E-AC-3', 'A_AAC': 'AAC', A_OPUS: 'Opus', A_VORBIS: 'Vorbis' };
let configCache;

const sha = (b) => createHash('sha256').update(b).digest('hex');
const round = (n, d = 3) => n == null || Number.isNaN(n) ? null : Number(Number(n).toFixed(d));
const ext = (name = '') => { const s = String(name).split(/[?#]/)[0]; const i = s.lastIndexOf('.'); return i > -1 ? s.slice(i + 1).toLowerCase() : ''; };
const clean = (name = '') => { const s = path.basename(String(name)).replace(/[^\w.\-() ]+/g, '_').slice(0, 180); return s || 'media'; };
const sizeText = (n) => { if (!n) return '0 B'; const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; } return `${round(n, 2)} ${u[i]}`; };
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const ratio = (w, h) => w && h ? `${w / gcd(w, h)}:${h / gcd(w, h)}` : null;
const label = (w, h) => {
  if (!w || !h) return null;
  const known = { 2160: '4K', 1440: '1440p', 1080: '1080p', 720: '720p', 480: '480p', 360: '360p', 240: '240p' };
  return known[Math.min(w, h)] || `${h}p`;
};

function parseMain(js) {
  const block = js.match(/NETWORKS:\{([\s\S]*?)\},FAMILY_DEFAULT_SIZE:\{([\s\S]*?)\}/);
  const networks = {};
  if (block) {
    for (const m of block[1].matchAll(/(?:^|,)\s*["']?([\w-]+)["']?\s*:\s*\{([^}]*)\}/g)) {
      const f = {};
      for (const kv of m[2].matchAll(/(\w+)\s*:\s*["']([^"']*)["']/g)) f[kv[1]] = kv[2];
      if (f.name && f.weightsUrl) networks[m[1]] = { name: f.name, weightsUrl: f.weightsUrl, family: f.family || 'sharpen', size: f.size || 'medium' };
    }
  }
  const familyDefaults = {};
  if (block) for (const m of block[2].matchAll(/(\w+)\s*:\s*["']([^"']+)["']/g)) familyDefaults[m[1]] = m[2];
  const defaults = { ...DEFAULTS };
  const pick = (re, d) => js.match(re)?.[1] || d;
  defaults.networkSize = js.match(/load_progress:0,networkSize:\s*["']([^"']+)/)?.[1] || js.match(/networkSize:\s*["']([^"']+)["'],hideNetworkSelector/)?.[1] || defaults.networkSize;
  defaults.selectedResolution = pick(/selectedResolution:\s*["']([^"']+)/, defaults.selectedResolution);
  defaults.outputCodec = pick(/outputCodec:\s*["']([^"']+)/, defaults.outputCodec);
  defaults.outputContainer = pick(/outputContainer:\s*["']([^"']+)/, defaults.outputContainer);
  const ab = js.match(/AUDIO_BITRATE:\s*(\d+(?:\.\d+)?e?\d*)/i);
  if (ab) defaults.audioBitrate = parseFloat(ab[1]) < 1000 ? Math.round(parseFloat(ab[1]) * 1000) : Math.round(parseFloat(ab[1]));
  const bb = js.match(/BITRATE_BASE:\s*(\d+(?:\.\d+)?e\d+|\d+)/i);
  if (bb) defaults.bitrateBase = Math.round(parseFloat(bb[1]));
  return { networks: Object.keys(networks).length ? networks : NETWORKS, familyDefaults, defaults };
}

async function scrape() {
  try {
    const page = await axios.get(SITE, { timeout: 20000, headers: { 'user-agent': UA } });
    const $ = cheerio.load(page.data);
    const src = $('script[src*="main"]').attr('src') || '/main.js';
    const mainUrl = new URL(src, SITE).href;
    const main = await axios.get(mainUrl, { timeout: 30000, responseType: 'text', headers: { 'user-agent': UA } });
    const parsed = parseMain(main.data);
    const version = await axios.get(REPO, { timeout: 10000, headers: { 'user-agent': UA } })
      .then((r) => String(r.data.dependencies?.['@websr/websr'] || '').replace(/^\D+/, '')).catch(() => '');
    return { ...FALLBACK, ...parsed, siteUrl: SITE, title: $('title').text().trim(), mainScript: mainUrl, sdkVersion: version || '0.0.14', source: 'live' };
  } catch (e) {
    return { ...FALLBACK, warning: e.message };
  }
}

function getConfig() {
  if (!configCache) configCache = scrape();
  return configCache;
}

async function checkWeight(c, key) {
  const net = c.networks[key] || c.networks.medium;
  const url = new URL(net.weightsUrl, SITE).href;
  try {
    const r = await axios.head(url, { timeout: 15000, validateStatus: () => true, headers: { 'user-agent': UA } });
    return { url, status: r.status, size: Number(r.headers['content-length'] || 0) || null, ok: r.status === 200 };
  } catch {
    return { url, status: 0, size: null, ok: false };
  }
}

function detect(buf, name = '') {
  const e = ext(name);
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { format: 'JPEG', mime: 'image/jpeg', kind: 'image' };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { format: 'PNG', mime: 'image/png', kind: 'image' };
  if (buf.length >= 6 && ['GIF87a', 'GIF89a'].includes(buf.toString('latin1', 0, 6))) return { format: 'GIF', mime: 'image/gif', kind: 'image' };
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return { format: 'WebP', mime: 'image/webp', kind: 'image' };
  if (buf.length >= 12 && buf.toString('latin1', 4, 8) === 'ftyp') {
    const brand = buf.toString('latin1', 8, 12);
    return brand === 'qt  ' ? { format: 'MOV', mime: 'video/quicktime', kind: 'video' } : { format: 'MP4', mime: 'video/mp4', kind: 'video' };
  }
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    const webm = e === 'webm' || buf.toString('latin1', 0, 200).includes('webm');
    return { format: webm ? 'WebM' : 'MKV', mime: webm ? 'video/webm' : 'video/x-matroska', kind: 'video' };
  }
  const byExt = { jpg: ['JPEG', 'image/jpeg', 'image'], jpeg: ['JPEG', 'image/jpeg', 'image'], png: ['PNG', 'image/png', 'image'], gif: ['GIF', 'image/gif', 'image'], webp: ['WebP', 'image/webp', 'image'], mp4: ['MP4', 'video/mp4', 'video'], m4v: ['MP4', 'video/mp4', 'video'], mov: ['MOV', 'video/quicktime', 'video'], webm: ['WebM', 'video/webm', 'video'], mkv: ['MKV', 'video/x-matroska', 'video'] };
  if (byExt[e]) return { format: byExt[e][0], mime: byExt[e][1], kind: byExt[e][2] };
  return { format: null, mime: 'application/octet-stream', kind: null };
}

function jpeg(b) {
  let o = 2;
  while (o + 9 < b.length) {
    if (b[o] !== 0xff) { o++; continue; }
    const m = b[o + 1];
    if (m === 0xd9 || m === 0xda) break;
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { o += 2; continue; }
    const len = b.readUInt16BE(o + 2);
    if (len < 2) break;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(m)) {
      return { width: b.readUInt16BE(o + 7), height: b.readUInt16BE(o + 5), bitDepth: b[o + 4], colorSpace: b[o + 9] === 1 ? 'Grayscale' : 'YCbCr' };
    }
    o += 2 + len;
  }
  return {};
}

function webp(b) {
  let width = null, height = null, animated = false, o = 12;
  while (o + 8 <= b.length) {
    const t = b.toString('latin1', o, o + 4);
    const len = b.readUInt32LE(o + 4);
    const d = o + 8;
    if (!len || d + len > b.length) break;
    if (t === 'VP8X') { width = 1 + b.readUIntLE(d + 4, 3); height = 1 + b.readUIntLE(d + 7, 3); animated = !!(b[d] & 2); }
    else if (t === 'VP8L') { const v = b.readUInt32LE(d + 1); width = 1 + (v & 0x3fff); height = 1 + ((v >> 14) & 0x3fff); }
    else if (t === 'VP8 ' && b[d + 3] === 0x9d && b[d + 4] === 0x01 && b[d + 5] === 0x2a) { width = b.readUInt16LE(d + 6) & 0x3fff; height = b.readUInt16LE(d + 8) & 0x3fff; }
    o = d + len + (len & 1);
  }
  return { width, height, bitDepth: 8, colorSpace: 'RGB', animated };
}

function boxes(b, s, e) {
  const out = [];
  while (s + 8 <= e) {
    let size = b.readUInt32BE(s);
    const type = b.toString('latin1', s + 4, s + 8);
    let head = 8;
    if (size === 1 && s + 16 <= e) { size = Number(b.readBigUInt64BE(s + 8)); head = 16; }
    else if (size === 0) size = e - s;
    if (size < head || s + size > e) break;
    out.push({ type, s, d: s + head, e: s + size });
    s += size;
  }
  return out;
}

const child = (b, p, type) => p ? boxes(b, p.d, p.e).find((x) => x.type === type) : null;

function mp4(b) {
  const moov = boxes(b, 0, b.length).find((x) => x.type === 'moov');
  if (!moov) return {};
  const out = { duration: null, videoCodec: null, audioCodec: null, width: null, height: null, fps: null, totalFrames: null, bitrate: null, audioBitrate: null, sampleRate: null, audioChannels: null, bitDepth: 8, colorSpace: null, isHdr: false };
  const mv = child(b, moov, 'mvhd');
  if (mv) {
    const v = b[mv.d];
    const ts = v ? b.readUInt32BE(mv.d + 20) : b.readUInt32BE(mv.d + 12);
    const dur = v ? Number(b.readBigUInt64BE(mv.d + 24)) : b.readUInt32BE(mv.d + 16);
    if (ts) out.duration = round(dur / ts);
  }
  for (const trak of boxes(b, moov.d, moov.e).filter((x) => x.type === 'trak')) {
    const mdia = child(b, trak, 'mdia');
    if (!mdia) continue;
    const hdlr = child(b, mdia, 'hdlr');
    const handler = hdlr ? b.toString('latin1', hdlr.d + 8, hdlr.d + 12) : '';
    const mdhd = child(b, mdia, 'mdhd');
    let ts = 0;
    if (mdhd) { const v = b[mdhd.d]; ts = v ? b.readUInt32BE(mdhd.d + 20) : b.readUInt32BE(mdhd.d + 12); }
    const stbl = child(b, child(b, mdia, 'minf'), 'stbl');
    const stsd = child(b, stbl, 'stsd');
    if (!stsd) continue;
    const entry = boxes(b, stsd.d + 8, stsd.e)[0];
    if (!entry) continue;
    const codec = b.toString('latin1', entry.s + 4, entry.s + 8);
    if (handler === 'vide' && !out.videoCodec) {
      out.videoCodec = VC[codec] || codec;
      out.width = b.readUInt16BE(entry.d + 24);
      out.height = b.readUInt16BE(entry.d + 26);
      const stts = child(b, stbl, 'stts');
      if (stts) {
        const n = b.readUInt32BE(stts.d + 4);
        let frames = 0, dur = 0, o = stts.d + 8;
        for (let i = 0; i < n; i++, o += 8) { frames += b.readUInt32BE(o); dur += b.readUInt32BE(o) * b.readUInt32BE(o + 4); }
        out.totalFrames = frames;
        if (frames && dur && ts) out.fps = round(frames / (dur / ts));
      }
      out.isHdr = b.toString('latin1', trak.d, trak.e).includes('mdcv');
    } else if (handler === 'soun' && !out.audioCodec) {
      out.audioCodec = AC[codec] || codec;
      out.audioChannels = b.readUInt16BE(entry.d + 16);
      out.sampleRate = b.readUInt32BE(entry.d + 24) >>> 16;
    }
  }
  if (out.duration && !out.bitrate) out.bitrate = Math.round(b.length * 8 / out.duration);
  return out;
}

function vint(b, o, e, id = false) {
  if (o >= e) return null;
  const f = b[o];
  let l = 1, m = 0x80;
  while (l <= 8 && !(f & m)) { m >>= 1; l++; }
  if (l > 8 || o + l > e || !f) return null;
  let v = id ? f : f & (m - 1);
  for (let i = 1; i < l; i++) v = v * 256 + b[o + i];
  return { l, v };
}

function els(b, s, e) {
  const out = [];
  while (s < e) {
    const id = vint(b, s, e, true);
    if (!id) break;
    const sz = vint(b, s + id.l, e);
    if (!sz) break;
    const d = s + id.l + sz.l;
    const end = Math.min(e, d + sz.v);
    out.push({ id: id.v, d, e: end });
    if (end <= d) break;
    s = end;
  }
  return out;
}

const uint = (b, x) => { if (!x) return null; let v = 0; for (let i = x.d; i < x.e; i++) v = v * 256 + b[i]; return v; };
const str = (b, x) => x ? b.toString('utf8', x.d, x.e).replace(/\0+$/, '') : '';
const flt = (b, x) => { if (!x) return null; const n = x.e - x.d; return n === 4 ? b.readFloatBE(x.d) : n === 8 ? b.readDoubleBE(x.d) : null; };

function webm(b) {
  const seg = els(b, 0, b.length).find((x) => x.id === 0x18538067);
  if (!seg) return {};
  const top = els(b, seg.d, seg.e);
  const info = top.find((x) => x.id === 0x1549a966);
  const tracks = top.find((x) => x.id === 0x1654ae6b);
  const out = { duration: null, videoCodec: null, audioCodec: null, width: null, height: null, fps: null, totalFrames: null, bitrate: null, audioBitrate: null, sampleRate: null, audioChannels: null, bitDepth: 8, colorSpace: null, isHdr: false };
  if (info) {
    const ic = els(b, info.d, info.e);
    const scale = uint(b, ic.find((x) => x.id === 0x2ad7b1)) || 1e6;
    const d = flt(b, ic.find((x) => x.id === 0x4489));
    if (d) out.duration = round(d * scale / 1e9);
  }
  if (tracks) for (const t of els(b, tracks.d, tracks.e).filter((x) => x.id === 0xae)) {
    const tc = els(b, t.d, t.e);
    const type = uint(b, tc.find((x) => x.id === 0x83));
    const codec = str(b, tc.find((x) => x.id === 0x86));
    if (type === 1 && !out.videoCodec) {
      const v = tc.find((x) => x.id === 0xe0);
      if (v) {
        const vc = els(b, v.d, v.e);
        out.width = uint(b, vc.find((x) => x.id === 0xb0));
        out.height = uint(b, vc.find((x) => x.id === 0xba));
        const dd = uint(b, tc.find((x) => x.id === 0x23e383));
        if (dd) out.fps = round(1e9 / dd);
        const col = vc.find((x) => x.id === 0x55b0);
        if (col) { const cc = els(b, col.d, col.e); out.isHdr = [16, 18].includes(uint(b, cc.find((x) => x.id === 0x55ba))); }
      }
      out.videoCodec = VC[codec] || codec || 'unknown';
    } else if (type === 2 && !out.audioCodec) {
      const a = tc.find((x) => x.id === 0xe1);
      if (a) {
        const ac = els(b, a.d, a.e);
        out.sampleRate = flt(b, ac.find((x) => x.id === 0xb5));
        out.audioChannels = uint(b, ac.find((x) => x.id === 0x9f));
      }
      out.audioCodec = AC[codec] || codec || 'unknown';
    }
  }
  if (out.duration && !out.bitrate) out.bitrate = Math.round(b.length * 8 / out.duration);
  return out;
}

function probe(buf, name = '') {
  const d = detect(buf, name);
  if (!d.format) throw new Error('Format media tidak didukung');
  let m;
  if (d.format === 'JPEG') m = jpeg(buf);
  else if (d.format === 'PNG') m = { width: buf.length >= 26 ? buf.readUInt32BE(16) : null, height: buf.length >= 26 ? buf.readUInt32BE(20) : null, bitDepth: buf.length >= 26 ? buf[24] : 8, colorSpace: 'RGB' };
  else if (d.format === 'GIF') m = { width: buf.length >= 10 ? buf.readUInt16LE(6) : null, height: buf.length >= 10 ? buf.readUInt16LE(8) : null, bitDepth: 8, colorSpace: 'Palette' };
  else if (d.format === 'WebP') m = webp(buf);
  else if (d.format === 'MP4' || d.format === 'MOV') m = mp4(buf);
  else if (d.format === 'WebM' || d.format === 'MKV') m = webm(buf);
  else throw new Error('Parser metadata belum tersedia');
  const width = m.width ? Math.round(m.width) : null;
  const height = m.height ? Math.round(m.height) : null;
  return { ...d, width, height, resolution: width && height ? `${width}x${height}` : null, aspect_ratio: ratio(width, height), duration: round(m.duration), fps: round(m.fps), totalFrames: m.totalFrames || null, videoCodec: m.videoCodec || null, audioCodec: m.audioCodec || null, bitrate: m.bitrate || (d.kind === 'video' && m.duration ? Math.round(buf.length * 8 / m.duration) : null), audioBitrate: m.audioBitrate || null, sampleRate: m.sampleRate || null, audioChannels: m.audioChannels || null, colorSpace: m.colorSpace || null, bitDepth: m.bitDepth || 8, isHdr: !!m.isHdr, parser: d.kind === 'image' ? 'node-bytes' : (d.format === 'WebM' || d.format === 'MKV' ? 'node-ebml' : 'node-bmff') };
}

function inputFrom(file, p, c) {
  return {
    source: file.url || file.origin, source_type: file.origin, filename: file.filename, file_size: file.buf.length, file_size_formatted: sizeText(file.buf.length), file_extension: ext(file.filename), mime_type: p.mime, file_format: p.format, file_hash: sha(file.buf), media_type: p.kind, format: p.format, duration: p.duration, width: p.width, height: p.height, resolution: p.resolution, aspect_ratio: p.aspect_ratio, fps: p.fps, total_frames: p.totalFrames, video_codec: p.videoCodec, audio_codec: p.audioCodec, bitrate: p.bitrate, audio_bitrate: p.audioBitrate, sample_rate: p.sampleRate, audio_channels: p.audioChannels, color_space: p.colorSpace, bit_depth: p.bitDepth, is_hdr: p.isHdr, metadata: { parser: p.parser, engine_source: c.source, warning: c.warning || null }
  };
}

function buildReport(input, c, key, weight, opts) {
  const net = c.networks[key] || c.networks.medium;
  const scale = Math.max(1, parseInt(String(opts.scale || c.defaults.selectedResolution || '2'), 10) || 2);
  const cap = input.media_type === 'image' ? c.defaults.maxImageDimension : c.defaults.maxVideoDimension;
  let tw = null, th = null;
  if (input.width && input.height) {
    const rw = input.width * scale, rh = input.height * scale;
    const k = Math.min(1, cap / Math.max(rw, rh));
    tw = Math.max(2, 2 * Math.floor(rw * k / 2));
    th = Math.max(2, 2 * Math.floor(rh * k / 2));
  }
  const target = tw && th ? label(tw, th) : null;
  const video = input.media_type === 'video';
  const outExt = video ? (input.format === 'WebM' ? 'webm' : 'mp4') : 'png';
  const outCodec = video ? (outExt === 'webm' ? 'vp9' : 'h264') : 'png';
  const audioRate = video && input.audio_codec ? c.defaults.audioBitrate : 0;
  const bitrate = video && tw ? Math.round(c.defaults.bitrateBase * (tw * th * 4) / c.defaults.bitrateRef) : null;
  const fileSize = video ? (input.duration && bitrate ? Math.round((bitrate + audioRate) / 8 * input.duration) : null) : (tw && th ? Math.round(tw * th * 3 * 0.55) : null);
  const base = input.filename.replace(/\.[^.]+$/, '');
  const suffix = tw ? `${label(input.width, input.height) || input.height + 'p'}_to_${target}` : 'upscaled';
  const filename = `${base}_${suffix}_upscaled.${outExt}`;
  const bad = !!input.is_hdr || !target;
  const available = weight.ok === true ? 'available' : weight.ok === false ? 'unavailable' : 'unchecked';
  return {
    status: bad ? 'error' : 'success',
    job_id: randomUUID(),
    input,
    device: {
      browser: 'Node.js', browser_version: process.version, os: `${process.platform} ${process.arch}`, device_type: 'cli', webgpu_supported: false, webgl_supported: false, webcodecs_supported: false, gpu_name: null, gpu_vendor: null, gpu_backend: null, max_texture_size: null, hardware_acceleration: false, filesystem_supported: true, processing_backend: 'websr-client'
    },
    engine: {
      name: 'WebSR', engine_name: 'WebSR', engine_version: c.sdkVersion, sdk: '@websr/websr', sdk_name: '@websr/websr', sdk_version: c.sdkVersion, model: net.name, ai_model: net.name, model_id: key, model_type: net.family, model_size: net.size, model_weights: weight.url, model_weights_status: available, model_weights_size: weight.size, model_architecture: net.family === 'detail' ? 'UNet' : 'CNN', processing_backend: 'websr-client', upscale_factor: scale, effective_resolution: target, model_initialization: 'not_initialized', available_models: Object.keys(c.networks)
    },
    settings: {
      ai_model: net.name, model_quality: net.size, model_size: net.size, quality: net.size, processing_mode: net.family, network_key: key, upscale_factor: scale, target_resolution: target, target_width: tw, target_height: th, output_fps: input.fps, preserve_aspect_ratio: true, preserve_audio: !!input.audio_codec, output_codec: outCodec, output_format: outExt, output_container: outExt, save_to_disk: false, max_dimension: cap
    },
    processing: {
      status: bad ? 'error' : 'prepared', stage: bad ? 'failed' : 'ready_for_browser', initialization: bad ? 'pending' : 'ready', decoder: bad ? 'pending' : (video ? 'ready' : 'not_applicable'), frame_processing: bad ? 'pending' : 'ready', encoder: bad ? 'pending' : 'ready', muxer: bad ? 'pending' : 'ready', current_frame: 0, processed_frames: 0, failed_frames: 0, total_frames: input.total_frames || 0, progress: 0, processing_speed: null, average_processing_time: null, elapsed_time: 0, estimated_time_remaining: null, pause_status: 'not_started', resume_status: 'not_started', cancel_status: 'not_started', queue_status: bad ? 'blocked' : 'ready', memory_usage: null
    },
    output: {
      filename, format: outExt, codec: outCodec === 'h264' ? 'H.264' : outCodec.toUpperCase(), file_size: fileSize, width: tw, height: th, resolution: target, fps: input.fps, duration: input.duration, audio_codec: input.audio_codec, audio_preserved: !!input.audio_codec, watermark: null, download_status: bad ? 'failed' : 'prepared', download_url: null, output_metadata: { estimated: true, rendered: false, requires_webgpu: true, note: 'Rendering dilakukan di browser target; report ini hanya job siap-render.' }
    },
    comparison: {
      original_resolution: input.resolution, upscaled_resolution: tw && th ? `${tw}x${th}` : null, original_preview: null, upscaled_preview: null, comparison_mode: 'side_by_side', sharpness_result: null, detail_result: null, comparison_status: bad ? 'unavailable' : 'ready'
    },
    error: {
      status: bad ? 'error' : 'none', error_code: bad ? (input.is_hdr ? 'HDR_UNSUPPORTED' : 'METADATA_UNAVAILABLE') : null, error_message: bad ? (input.is_hdr ? 'Media HDR belum didukung.' : 'Dimensi media tidak terbaca.') : null, error_stage: bad ? 'input' : null, gpu_crash: false, decoder_error: false, encoder_error: false, unsupported_codec: false, unsupported_format: false, unsupported_hdr: !!input.is_hdr, memory_error: false, recovery_status: 'not_needed', retry_available: false
    },
    batch: {
      batch_id: null, total_files: 1, completed_files: 0, failed_files: bad ? 1 : 0, pending_files: bad ? 0 : 1, current_file: null, batch_progress: 0, individual_progress: {}, batch_status: bad ? 'failed' : 'ready', download_all_status: 'not_available'
    }
  };
}

function fromBase64(value, filename) {
  if (value.startsWith('data:')) {
    const m = value.match(/^data:([^;,]+)?;base64,([\s\S]*)$/);
    if (!m) throw new Error('Base64 data URL tidak valid');
    const mime = m[1] || 'application/octet-stream';
    const e = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
    return { buf: Buffer.from(m[2], 'base64'), filename: clean(filename || `input.${e}`), origin: 'base64' };
  }
  return { buf: Buffer.from(value.replace(/^base64:\/\//, ''), 'base64'), filename: clean(filename || 'input.bin'), origin: 'base64' };
}

async function load(source) {
  if (Buffer.isBuffer(source)) return { buf: source, filename: 'upload.bin', origin: 'buffer' };
  if (source && typeof source === 'object') {
    if (source.buffer) return { buf: Buffer.from(source.buffer), filename: clean(source.filename || 'upload.bin'), origin: source.origin || 'upload' };
    if (source.base64) return fromBase64(String(source.base64), source.filename);
  }
  const s = String(source || '').trim();
  if (!s) throw new Error('Sumber media kosong');
  if (s.startsWith('data:') || s.startsWith('base64://')) return fromBase64(s);
  if (/^https?:\/\//i.test(s)) {
    const r = await axios.get(s, { responseType: 'arraybuffer', timeout: 60000, maxContentLength: 200 * 1024 * 1024, headers: { 'user-agent': UA } });
    const u = new URL(r.request?.res?.responseUrl || s);
    return { buf: Buffer.from(r.data), filename: clean(path.basename(u.pathname)), origin: 'url', url: s };
  }
  const full = path.resolve(s);
  return { buf: await readFile(full), filename: clean(path.basename(full)), origin: 'file', url: full };
}

async function save(report, out = 'result.json') {
  const file = path.resolve(out);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(report, null, 2) + '\n');
}

async function analyze(source, opts = {}) {
  const c = await getConfig();
  const file = await load(source);
  const p = probe(file.buf, file.filename);
  if (opts.type && opts.type !== p.kind) throw new Error(`Media terdeteksi ${p.kind}, bukan ${opts.type}`);
  const input = inputFrom(file, p, c);
  const key = opts.model && c.networks[opts.model] ? opts.model : c.defaults.networkSize;
  const netKey = c.networks[key] ? key : 'medium';
  const weight = opts.noWeights ? { url: new URL(c.networks[netKey].weightsUrl, SITE).href, status: null, size: null, ok: null } : await checkWeight(c, netKey);
  const report = buildReport(input, c, netKey, weight, opts);
  if (opts.write !== false) await save(report, opts.out || 'result.json');
  return report;
}

async function serve(opts) {
  const server = http.createServer(async (req, res) => {
    let o = { ...opts };
    try {
      res.setHeader('access-control-allow-origin', '*');
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      const u = new URL(req.url, 'http://localhost');
      let source = u.searchParams.get('url');
      if (req.method === 'POST') {
        const chunks = [];
        for await (const ch of req) chunks.push(ch);
        const raw = Buffer.concat(chunks);
        const ct = req.headers['content-type'] || '';
        if (ct.includes('application/json')) {
          const j = JSON.parse(raw.toString() || '{}');
          if (j.url) source = j.url;
          else if (j.base64) source = { base64: j.base64, filename: j.filename || 'input.bin' };
          else throw new Error('JSON butuh url atau base64');
          o = { ...o, type: j.type || o.type, model: j.model || o.model, scale: j.scale || o.scale };
        } else {
          source = { buffer: raw, filename: u.searchParams.get('filename') || 'upload.bin', origin: 'upload' };
        }
      }
      if (!source) throw new Error('Sumber kosong; kirim ?url= atau body media');
      o = { ...o, type: u.searchParams.get('type') || o.type, model: u.searchParams.get('model') || o.model, scale: u.searchParams.get('scale') || o.scale };
      const report = await analyze(source, { ...o, write: false });
      await save(report, o.out || 'result.json');
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(report, null, 2));
    } catch (e) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ status: 'error', error: e.message }));
    }
  });
  await new Promise((ok, no) => { server.once('error', no); server.listen(Number(opts.port) || 8787, opts.host || '127.0.0.1', ok); });
  return server;
}

const USAGE = `scrape-freeupscaler 1.0.0
Usage:
  node scrape-freeupscaler.js <url|file> [--image|--video] [--model medium] [--scale 2x] [--out result.json]
  node scrape-freeupscaler.js --base64 <data|data-url> [--filename input.jpg]
  node scrape-freeupscaler.js --serve [--port 8787] [--host 127.0.0.1]
Options: --no-weights --no-write --quiet
POST /scrape: {url} atau {base64,filename}; raw body juga didukung.`;

function parseArgs(argv) {
  const o = {}, pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('-')) { pos.push(a); continue; }
    if (a === '--image') o.type = 'image';
    else if (a === '--video') o.type = 'video';
    else if (a === '--serve') o.serve = true;
    else if (a === '--no-weights') o.noWeights = true;
    else if (a === '--no-write') o.write = false;
    else if (a === '--quiet') o.quiet = true;
    else if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--version' || a === '-v') o.version = true;
    else if (['--model', '--scale', '--out', '--port', '--host', '--base64', '--filename', '--type'].includes(a)) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} butuh nilai`);
      o[a.slice(2)] = v;
    } else throw new Error(`Opsi tidak dikenal: ${a}`);
  }
  if (pos[0]) o.source = pos[0];
  if (o.base64) o.source = { base64: o.base64, filename: o.filename || 'input.bin' };
  if (o.type) o.type = o.type.toLowerCase();
  return o;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.version) { console.log('scrape-freeupscaler 1.0.0'); return; }
  if (o.help || (!o.source && !o.serve)) { console.log(USAGE); return; }
  if (o.serve) {
    const server = await serve(o);
    const addr = server.address();
    console.log(`Listening http://${addr.address}:${addr.port}/scrape`);
    return;
  }
  const report = await analyze(o.source, o);
  if (!o.quiet) console.error(`${report.status}: ${report.output.filename} (${report.settings.target_resolution || 'unknown'}) -> ${o.out || 'result.json'}`);
  console.log(JSON.stringify(report, null, 2));
}

const invoked = process.argv[1] && path.basename(process.argv[1]) === 'scrape-freeupscaler.js';
if (invoked) main().catch((e) => { console.error(e.message); process.exitCode = 1; });

export { analyze, scrape, getConfig, probe, detect, mp4, webm, buildReport, load, save, serve, parseArgs };
export default analyze;
