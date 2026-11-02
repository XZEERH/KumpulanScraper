#!/usr/bin/env node

/**
 * Name : Tiktok stiker
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web : https://www.tiktok.com/
 * Type : Scraper
 * Description : Mengambil stiker yang dikirim pengguna melalui kolom komentar video TikTok. Engine menerima URL video TikTok dari user, membaca komentar yang tersedia, mendeteksi komentar bertipe stiker, kemudian mengambil URL aset stiker aslinya dan mengunduh file tersebut. Btw udah support animasi.
Note : Error fix sendiri
 */

process.title = 'tiktok-stiker';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const API_COMMENT = 'https://www.tiktok.com/api/comment/list/';
const API_REPLY = 'https://www.tiktok.com/api/comment/list/reply/';
const COUNT = 50;

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
];

const CURSOR_BACKOFF = [0, 500, 1100, 2400, 4200, 7600];

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms + Math.floor(Math.random() * 180)));
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function toIsoSec(unix) {
  const n = Number(unix);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function pickUa(attempt) {
  return UA_POOL[(attempt >= 0 ? attempt : 0) % UA_POOL.length];
}

function mkHeaders(ua, referer) {
  return {
    'User-Agent': ua,
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    Referer: referer || 'https://www.tiktok.com/',
    Origin: 'https://www.tiktok.com',
  };
}

async function httpJson(url, params, referer, log, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await axios.get(url, {
        params,
        headers: mkHeaders(pickUa(i), referer),
        timeout: 25000,
        maxRedirects: 5,
        validateStatus: () => true,
      });
      if (res.status === 200 && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        if ('comments' in res.data || 'has_more' in res.data || 'status_code' in res.data) return res.data;
        throw new Error('bukan payload komentar (keys: ' + Object.keys(res.data).slice(0, 4).join(',') + ')');
      }
      if (res.status === 429 || res.status === 403 || res.status >= 500) throw new Error('HTTP ' + res.status);
      if (typeof res.data === 'string') throw new Error('HTML saat mencoba API (coba/melawan verifikasi TikTok)');
      throw new Error('HTTP ' + res.status);
    } catch (err) {
      if (log) log('warn', 'httpJson gagal (' + (i + 1) + '/' + attempts + '): ' + (err.response ? 'HTTP ' + (err.response.status) : err.message));
      if (i < attempts - 1) await sleep(CURSOR_BACKOFF[Math.min(i + 1, CURSOR_BACKOFF.length - 1)]);
    }
  }
  if (log) log('fail', 'httpJson GAGAL semua percobaan: ' + url + ' ' + JSON.stringify(params));
  return null;
}

function isTiktokHost(hostname) {
  return /^(?:www|m|vm|vt|t)\.tiktok\.com$/i.test(hostname) || /(?:^|\.)tiktok\.com$/i.test(hostname);
}

function extractVideoCandidate(text) {
  if (!text) return null;
  const patterns = [/(?:video|photo|v)\/(\d{6,})/, /item_id=(\d{6,})/, /aweme_id=(\d{6,})/, /player\/v1\/(\d{6,})/, /\/(\d{15,})/];
  for (const p of patterns) {
    const m = String(text).match(p);
    if (m) return m[1];
  }
  return null;
}

async function resolveTikTokUrl(input, log) {
  let asUrl;
  try {
    asUrl = new URL(/^https?:\/\//i.test(input) ? input : 'https://' + input);
  } catch {
    asUrl = new URL('https://www.tiktok.com/');
  }
  if (!isTiktokHost(asUrl.hostname)) throw new Error('URL bukan host TikTok: ' + asUrl.hostname);

  let videoId = extractVideoCandidate(asUrl.pathname) || extractVideoCandidate(asUrl.search);
  let author = (asUrl.pathname.match(/\/@([^/]+)/) || [])[1] || null;
  let canonical = null;

  if (videoId && videoId.length > 0 && (asUrl.pathname.includes('/video/') || asUrl.pathname.includes('/photo/') || asUrl.pathname.includes('/player/'))) {
    canonical = 'https://www.tiktok.com/@' + (author || 'user') + '/video/' + videoId;
  } else {
    let finalUrl = null;
    let html = null;
    try {
      const res = await axios.get(asUrl.toString(), {
        headers: mkHeaders(pickUa(0), 'https://www.tiktok.com/'),
        timeout: 30000,
        maxRedirects: 8,
        validateStatus: () => true,
        responseType: 'text',
      });
      finalUrl = res.request && res.request.res && res.request.res.responseUrl ? res.request.res.responseUrl : null;
      html = typeof res.data === 'string' ? res.data : null;
      if (finalUrl) {
        videoId = videoId || extractVideoCandidate(finalUrl);
        author = author || ((finalUrl.match(/\/@([^/]+)/) || [])[1] || (finalUrl.match(/\/@([^/]+)/) || [])[1] || null);
      }
    } catch (err) {
      if (log) log('warn', 'redirect short-url gagal: ' + err.message);
    }

    if (!videoId && html) {
      try {
        const $ = cheerio.load(html);
        for (const sel of ['link[rel="canonical"]', 'meta[property="og:url"]']) {
          const v = sel.startsWith('meta') ? $(sel).attr('content') : $(sel).attr('href');
          if (v) {
            videoId = extractVideoCandidate(v);
            author = author || ((new URL(v, 'https://www.tiktok.com/').pathname.match(/\/@([^/]+)/) || [])[1] || null);
          }
          if (videoId) break;
        }
        if (!videoId) {
          const m = html.match(/"(?:videoId|vid|awemeId|item_id|itemId)"\s*:\s*"?(\d{15,})"?/);
          if (m) videoId = m[1];
        }
      } catch (err) {
        if (log) log('warn', 'parse HTML short-url gagal: ' + err.message);
      }
    }
    canonical = videoId ? 'https://www.tiktok.com/@' + (author || 'user') + '/video/' + videoId : asUrl.toString();
  }

  if (!videoId) throw new Error('tidak bisa menemukan video_id dari URL: ' + input);
  return { videoId, author, canonical, inputUrl: input };
}

async function fetchVideoInfo(videoId, log) {
  const info = { video_url: null, video_id: videoId, author: null, title: null };
  try {
    const res = await axios.get('https://www.tiktok.com/oembed', {
      params: { url: 'https://www.tiktok.com/@user/video/' + videoId },
      headers: mkHeaders(UA_POOL[0], 'https://www.tiktok.com/'),
      timeout: 20000,
      validateStatus: () => true,
    });
    if (res.status === 200 && res.data && typeof res.data === 'object') {
      info.title = res.data.title || null;
      info.author = (res.data.author_name || '').replace(/\s+/g, '').toLowerCase() || null;
      info.thumbnail = res.data.thumbnail_url || null;
    } else if (log) {
      log('warn', 'oembed HTTP ' + res.status);
    }
  } catch (err) {
    if (log) log('warn', 'oembed gagal: ' + err.message);
  }
  return info;
}

function eachResolution(bucket) {
  const out = [];
  if (!bucket || typeof bucket !== 'object') return out;
  const keys = ['high_resolution_url', 'mid_resolution_url', 'low_resolution_url'];
  for (const k of keys) {
    const node = bucket[k];
    if (node && typeof node === 'object' && Array.isArray(node.url_list) && node.url_list.length > 0 && typeof node.url_list[0] === 'string') {
      out.push({ key: k, url: node.url_list[0], width: node.width ?? null, height: node.height ?? null });
    }
  }
  return out;
}

function collectAssets(node, out, depth, originKey) {
  if (!node || typeof node !== 'object' || depth > 4) return;
  if (out.length >= 24) return;
  if (Array.isArray(node)) {
    for (const v of node) collectAssets(v, out, depth + 1, originKey);
    return;
  }
  const keys = ['animated_url', 'static_url', 'image_url', 'animation_url', 'webp_url', 'url', 'url_list', 'high_resolution_url', 'mid_resolution_url', 'low_resolution_url'];
  for (const k of Object.keys(node)) {
    let hitKey = originKey;
    if (node[k] === null || node[k] === undefined) continue;
    if (k === 'animated_url' || k === 'animation_url') hitKey = 'animated';
    else if (k === 'static_url' || k === 'image_url' || k === 'webp_url' || k === 'high_resolution_url') hitKey = originKey === 'animated' ? 'animated' : 'static';
    if (Array.isArray(node[k])) {
      const urls = node[k].filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
      if (urls.length > 0) {
        out.push({ url: urls[0], urlAll: urls, width: null, height: null, via: hitKey || k, key: k });
        continue;
      }
    } else if (typeof node[k] === 'string' && /^https?:\/\//i.test(node[k])) {
      out.push({ url: node[k], width: null, height: null, via: hitKey || k, key: k });
      continue;
    } else if (typeof node[k] === 'object') {
      const rs = eachResolution(node[k]);
      if (rs.length > 0) {
        for (const r of rs) out.push({ url: r.url, width: r.width, height: r.height, via: hitKey || k, key: k });
        continue;
      }
    }
    collectAssets(node[k], out, depth + 1, hitKey);
  }
}

function extractStickerFromComment(c) {
  const holder = c.cmt_sticker_struct || c.composer_sticker || c.cmt_emote_struct || c.sticker || c.composer_emote || c.emote || c.gif_sticker || null;
  if (!holder || typeof holder !== 'object') return null;
  const assets = [];
  collectAssets(holder, assets, 0, null);
  if (assets.length === 0) return null;
  const animated = assets.filter((a) => a.via === 'animated' || /\.awebp|\.lottie/i.test(a.url));
  const statics = assets.filter((a) => a.via !== 'animated' && !/\.awebp/i.test(a.url));
  const pool = animated.length > 0 ? animated : statics;
  const best = pool.find((a) => a.url) || pool[0];
  return {
    sticker_id: String(holder.id ?? holder.sticker_id ?? holder.emote_id ?? '') || null,
    sticker_type: holder.sticker_type ?? null,
    set_id: holder.set_id ?? null,
    name: holder.name || (holder.sticker_display_name ?? '') || null,
    url: best.url,
    width: best.width,
    height: best.height,
    animated_hint: animated.length > 0,
    animated_url: animated.length > 0 ? animated[0].url : null,
    static_url: statics.length > 0 ? statics[0].url : (animated.length > 0 ? animated[0].url : null),
  };
}

function classifyBuffer(buf) {
  const info = { format: 'unknown', ext: 'bin', is_animated: false, width: null, height: null };
  if (!Buffer.isBuffer(buf) || buf.length < 16) return info;
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45) {
    info.format = 'webp';
    info.ext = 'webp';
    info.is_animated = buf.includes(Buffer.from('ANIM')) && buf.includes(Buffer.from('ANMF'));
    const chunk = buf.toString('ascii', 12, 16);
    try {
      if (chunk === 'VP8X') {
        info.width = buf.readUintLE(24, 3) + 1;
        info.height = buf.readUintLE(27, 3) + 1;
      } else if (chunk === 'VP8 ') {
        info.width = buf.readUInt16LE(26) & 0x3fff;
        info.height = buf.readUInt16LE(28) & 0x3fff;
      } else if (chunk === 'VP8L' && buf[20] === 0x2f) {
        const b21 = buf[21], b22 = buf[22], b23 = buf[23], b24 = buf[24];
        info.width = ((b21 & 0xff) | ((b22 & 0x3f) << 8)) + 1;
        info.height = ((b23 & 0xff) | ((b24 & 0x0f) << 8)) + 1;
      }
    } catch (e) {}
  } else if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    info.format = 'gif';
    info.ext = 'gif';
    info.is_animated = true;
    try {
      info.width = buf.readUInt16LE(6);
      info.height = buf.readUInt16LE(8);
    } catch (e) {}
  } else if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    info.format = 'png';
    info.ext = 'png';
    info.is_animated = buf.includes(Buffer.from('acTL'));
    try {
      info.width = buf.readUInt32BE(16);
      info.height = buf.readUInt32BE(20);
    } catch (e) {}
  } else if (buf[0] === 0xff && buf[1] === 0xd8) {
    info.format = 'jpeg';
    info.ext = 'jpg';
    info.is_animated = false;
    try {
      let i = 2;
      let guard = 0;
      while (i < buf.length - 8 && guard++ < 1024) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          info.height = buf.readUInt16BE(i + 5);
          info.width = buf.readUInt16BE(i + 7);
          break;
        }
        const len = buf.readUInt16BE(i + 2);
        i += 2 + len;
      }
    } catch (e) {}
  }
  return info;
}

async function downloadAsset(url, log, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await axios.get(url, {
        headers: mkHeaders(pickUa(i), 'https://www.tiktok.com/'),
        timeout: 40000,
        maxRedirects: 5,
        responseType: 'arraybuffer',
        validateStatus: () => true,
      });
      const ct = String((res.headers && res.headers['content-type']) || '').toLowerCase();
      if (res.status === 200 && res.data && res.data.length > 0) {
        if (ct.includes('text/html')) throw new Error('CDN kembalikan HTML');
        return Buffer.from(res.data);
      }
      throw new Error('HTTP ' + res.status);
    } catch (err) {
      if (log) log('warn', 'unduh gagal (' + (i + 1) + '/' + attempts + '): ' + err.message);
      if (i < attempts - 1) await sleep(CURSOR_BACKOFF[Math.min(i + 1, CURSOR_BACKOFF.length - 1)] + 400);
    }
  }
  return null;
}

function normalizeCommentUser(c) {
  const u = (c && c.user) || {};
  return {
    user_id: String(u.uid ?? u.user_id ?? '') || null,
    username: u.unique_id ?? u.uniqueId ?? u.username ?? null,
    nickname: u.nickname ?? null,
  };
}

function normalizeParent(raw) {
  const s = raw == null ? '' : String(raw);
  if (!s || s === '0' || s === 'null' || s === 'undefined') return null;
  return s;
}

function createCtx(onLog, opts) {
  return {
    seen: new Set(),
    scanned: 0,
    rootScanned: 0,
    replyScanned: 0,
    threads: [],
    entries: [],
    root: { pages: 0, cursor: 0, has_more: false, stalled: 0 },
    replyQueueDone: 0,
    opts,
  };
}

function inspectComment(ctx, c, parentCid, scope) {
  if (!c || c.cid === undefined || c.cid === null) return;
  const cid = String(c.cid);
  if (ctx.seen.has(cid)) return;
  ctx.seen.add(cid);
  if (scope === 'root') ctx.rootScanned++;
  else ctx.replyScanned++;
  ctx.scanned++;

  if (Number(c.reply_comment_total) > 0 && parentCid == null) {
    ctx.threads.push({ cid, total: Number(c.reply_comment_total) });
  }

  const st = extractStickerFromComment(c);
  if (!st) return;

  ctx.entries.push(buildEntry(cid, parentCid, c, st, ctx.entries.length + 1));
}

function buildEntry(cid, parentCid, c, st, seq) {
  return {
    comment_id: cid,
    parent_comment_id: normalizeParent(parentCid),
    user: normalizeCommentUser(c),
    sticker: {
      sticker_id: st.sticker_id,
      sticker_url: st.url,
      sticker_format: null,
      format: null,
      is_animated: st.animated_hint,
      width: st.width,
      height: st.height,
      sticker_type: st.sticker_type,
      animated_url: st.animated_url,
      static_url: st.static_url,
    },
    comment: {
      comment_type: 'sticker',
      text: typeof c.text === 'string' ? c.text : null,
      create_time: toIsoSec(c.create_time),
      create_time_unix: c.create_time ?? null,
      digg_count: c.digg_count ?? null,
      reply_comment_total: c.reply_comment_total ?? null,
    },
    download: {
      file_name: null,
      file_path: null,
      status: st.url ? 'pending' : 'not_available',
      size_bytes: null,
      error: st.url ? null : 'url tidak tersedia di sumber data',
    },
    _seq: seq,
  };
}

async function scanRootComments(ctx, referer, log) {
  let cursor = 0;
  let hasMore = true;
  let emptyStreak = 0;
  const { maxPages } = ctx.opts;
  while (hasMore && (maxPages === null || ctx.root.pages < maxPages)) {
    const page = await httpJson(API_COMMENT, { aid: 1988, aweme_id: ctx.videoId, count: COUNT, cursor }, referer, log);
    if (!page) {
      emptyStreak++;
      if (log) log('warn', 'root page gagal dimuat (streak ' + emptyStreak + ') cursor=' + cursor);
      cursor += COUNT;
      if (emptyStreak >= 3) break;
      continue;
    }
    emptyStreak = 0;
    const list = Array.isArray(page.comments) ? page.comments : [];
    for (const c of list) inspectComment(ctx, c, null, 'root');
    ctx.root.pages++;
    if (log) log('info', 'root halaman ' + ctx.root.pages + ' cursor=' + cursor + ' ditampilkan=' + list.length + ' unik=' + ctx.rootScanned + ' stiker=' + ctx.entries.length);
    const nc = Number(page.cursor);
    cursor = Number.isFinite(nc) && nc > cursor ? nc : cursor + COUNT;
    hasMore = !!(page.has_more === 1 || page.has_more === true);
    ctx.root.cursor = cursor;
    ctx.root.has_more = hasMore;
    if (list.length === 0) emptyStreak++;
    if (emptyStreak >= 3) {
      if (log) log('warn', 'root kosong berulang, hentikan');
      break;
    }
    if (page.status_code === 10204) {
      if (log) log('fail', 'TikTok minta verifikasi (status_code 10204)');
      ctx.root.verification = true;
      break;
    }
    await sleep(ctx.opts.requestDelay);
  }
}

async function scanReplyThreads(ctx, referer, log) {
  const threads = ctx.threads;
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i];
    let cursor = 0;
    let hasMore = true;
    let jail = 0;
    while (hasMore && jail < 3) {
      const page = await httpJson(API_REPLY, { aid: 1988, item_id: ctx.videoId, comment_id: t.cid, count: COUNT, cursor }, referer, log);
      if (!page) {
        jail++;
        cursor += COUNT;
        continue;
      }
      const list = Array.isArray(page.comments) ? page.comments : [];
      for (const c of list) inspectComment(ctx, c, t.cid, 'reply');
      const nc = Number(page.cursor);
      cursor = Number.isFinite(nc) && nc >= cursor && nc !== cursor ? nc : cursor + COUNT;
      hasMore = !!(page.has_more === 1 || page.has_more === true);
    }
  }
}

async function scrapeTikTokStickers(inputUrl, options) {
  const startedAt = Date.now();
  const opts = Object.assign(
    {
      maxPages: null,
      maxStickers: null,
      scanReplies: true,
      requestDelay: 220,
      outputDir: path.join(process.cwd(), 'output'),
      onProgress: null,
    },
    options || {}
  );
  const logs = [];
  const log = (level, msg) => {
    const line = '[' + level.toUpperCase() + '] ' + msg;
    logs.push({ t: Date.now() - startedAt, level, msg });
    if (typeof opts.onProgress === 'function') opts.onProgress(level, msg);
  };

  const result = {
    platform: 'TikTok',
    scraper: 'TikTok Sticker Comment Scraper',
    video: { video_url: null, video_id: null, author: null },
    statistics: {},
    stickers: [],
    pagination: { has_more: false, cursor: null, pages_scanned: 0 },
    scrape: { status: 'completed', timestamp: null, duration_ms: 0 },
  };

  try {
    log('info', 'meresolusi URL: ' + inputUrl);
    const resolved = await resolveTikTokUrl(inputUrl, log);
    result.video.video_url = resolved.canonical;
    result.video.video_id = resolved.videoId;
    result.video.author = resolved.author;
    const referer = resolved.canonical;
    log('info', 'video_id=' + resolved.videoId + ' author=' + (resolved.author || '?') + ' referer=' + referer);

    const ctx = createCtx(log, opts);
    ctx.videoId = resolved.videoId;
    ctx.opts = opts;

    const info = await fetchVideoInfo(resolved.videoId, log);
    result.video.title = info.title || null;
    if (info.thumbnail) result.video.thumbnail = info.thumbnail;

    await scanRootComments(ctx, referer, log);

    if (opts.scanReplies && ctx.threads.length > 0) {
      log('info', 'mulai pindai balasan: ' + ctx.threads.length + ' thread');
      for (let i = 0; i < ctx.threads.length; i++) {
        const t = ctx.threads[i];
        if (opts.maxStickers !== null && ctx.entries.length >= opts.maxStickers) break;
        let cursor = 0;
        let hasMore = true;
        let jail = 0;
        let shown = false;
        while (hasMore && jail < 4) {
          const page = await httpJson(API_REPLY, { aid: 1988, item_id: ctx.videoId, comment_id: t.cid, count: COUNT, cursor }, referer, log, 5);
          if (!page) {
            jail++;
            cursor += COUNT;
            continue;
          }
          if (!shown) {
            shown = true;
            ctx.replyQueueDone++;
            if (i % 5 === 0 || i === ctx.threads.length - 1) log('info', 'balasan thread ' + (i + 1) + '/' + ctx.threads.length + ' cid=' + t.cid + ' unik=' + ctx.scanned + ' stiker=' + ctx.entries.length);
          }
          const list = Array.isArray(page.comments) ? page.comments : [];
          for (const c of list) inspectComment(ctx, c, t.cid, 'reply');
          const nc = Number(page.cursor);
          cursor = Number.isFinite(nc) && nc >= cursor && nc !== cursor ? nc : cursor + COUNT;
          hasMore = !!(page.has_more === 1 || page.has_more === true);
        }
        await sleep(Math.min(opts.requestDelay, 180));
      }
      log('info', 'balasan selesai: thread diproses=' + ctx.replyQueueDone + '/' + ctx.threads.length);
    }

    result.statistics = {
      total_comments_scanned: ctx.scanned,
      total_stickers_found: ctx.entries.length,
      total_stickers_downloaded: 0,
      total_download_failed: 0,
    };

    const outDir = path.join(opts.outputDir, resolved.videoId, 'stickers');
    fs.mkdirSync(outDir, { recursive: true });

    const stableNames = new Map();
    const entries = ctx.entries;
    if (opts.maxStickers !== null && entries.length > opts.maxStickers) entries.length = opts.maxStickers;

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const su = e.sticker.sticker_url;
      if (!su) {
        result.statistics.total_download_failed++;
        continue;
      }
      let buf = null;
      if (stableNames.has(su)) {
        buf = stableNames.get(su).buf;
      } else {
        buf = await downloadAsset(su, log);
        if (buf && buf.length > 0) stableNames.set(su, { buf, analyze: classifyBuffer(buf) });
      }
      const analysis = stableNames.get(su) ? stableNames.get(su).analyze : null;
      if (!buf) {
        e.download.status = 'failed';
        e.download.error = 'unduh gagal semua percobaan';
        result.statistics.total_download_failed++;
        log('fail', 'stiker ' + (i + 1) + '/' + entries.length + ' gagal diunduh');
        continue;
      }
      const det = analysis || classifyBuffer(buf);
      const idx = String(i + 1).padStart(3, '0');
      const fileName = 'sticker-' + idx + '.' + det.ext;
      const abs = path.join(outDir, fileName);
      fs.writeFileSync(abs, buf);
      const rel = ['output', resolved.videoId, 'stickers', fileName].join('/');
      e.download.file_name = fileName;
      e.download.file_path = rel;
      e.download.status = 'success';
      e.download.size_bytes = buf.length;
      result.statistics.total_stickers_downloaded++;
      e.sticker.sticker_format = det.format;
      e.sticker.format = det.format;
      e.sticker.is_animated = det.is_animated || e.sticker.is_animated;
      if (det.width) e.sticker.width = det.width;
      if (det.height) e.sticker.height = det.height;
      if ((i + 1) % 10 === 0 || i === entries.length - 1) log('info', 'unduh ' + (i + 1) + '/' + entries.length + ' sukses=' + result.statistics.total_stickers_downloaded + ' gagal=' + result.statistics.total_download_failed);
      await sleep(120);
    }

    result.stickers = entries.map((e) => ({
      comment_id: e.comment_id,
      parent_comment_id: e.parent_comment_id,
      user: e.user,
      sticker: {
        sticker_id: e.sticker.sticker_id,
        sticker_url: e.sticker.sticker_url,
        sticker_format: e.sticker.sticker_format,
        format: e.sticker.format,
        is_animated: e.sticker.is_animated,
        width: e.sticker.width,
        height: e.sticker.height,
      },
      comment: {
        comment_type: e.comment.comment_type,
        text: e.comment.text,
        create_time: e.comment.create_time,
      },
      download: {
        file_name: e.download.file_name,
        file_path: e.download.file_path,
        status: e.download.status,
      },
    }));

    result.pagination = {
      has_more: ctx.root.has_more,
      cursor: ctx.root.cursor > 0 ? ctx.root.cursor : null,
      pages_scanned: ctx.root.pages,
      reply_threads: ctx.threads.length,
      reply_threads_done: ctx.replyQueueDone,
    };
    result.statistics.total_comments_scanned = ctx.scanned;
    result.scrape.status = 'completed';
  } catch (err) {
    log('fail', 'katastropik: ' + err.message);
    result.scrape.status = 'failed';
    result.scrape.error = err.message;
  }

  result.scrape.timestamp = nowIso();
  result.scrape.duration_ms = Date.now() - startedAt;
  result.scrape.logs = logs.slice(-40);

  try {
    if (result.video.video_id) {
      const resDir = path.join(opts.outputDir, result.video.video_id);
      fs.mkdirSync(resDir, { recursive: true });
      fs.writeFileSync(path.join(resDir, 'result.json'), JSON.stringify(result, null, 2));
    }
  } catch (err) {
    if (typeof opts.onProgress === 'function') opts.onProgress('fail', 'simpan result.json gagal: ' + err.message);
  }

  return result;
}

function parseArgs(argv) {
  const args = { url: null, maxPages: null, maxStickers: null, noReplies: false, delay: 220, hasil: null };
  for (const raw of argv) {
    if (/^--max-pages=(\d+)$/.test(raw)) args.maxPages = Number(raw.split('=')[1]);
    else if (/^--limit=(\d+)$/.test(raw)) args.maxStickers = Number(raw.split('=')[1]);
    else if (raw === '--no-replies') args.noReplies = true;
    else if (/^--delay=(\d+)$/.test(raw)) args.delay = Number(raw.split('=')[1]);
    else if (/^--out=(.+)$/.test(raw)) args.outDir = raw.split('=').slice(1).join('=');
    else if (/^--/.test(raw)) { console.error('argumen tidak dikenali: ' + raw); }
    else if (args.url === null) args.url = raw;
  }
  return args;
}

function printLog(level, msg) {
  const tag = { verbose: '[ ]', info: '[i]', warn: '[!]', fail: '[x]' }[level] || '[ ]';
  console.error(' ' + tag + ' ' + msg);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    console.error('TikTok Sticker Comment Scraper');
    console.error('');
    console.error('Pemakaian:');
    console.error('  node scrape-stiker.js "<url tiktok>" [opsi]');
    console.error('');
    console.error('Opsi:');
    console.error('  --max-pages=N   batasi halaman komentar root (default: semua)');
    console.error('  --limit=N       batasi jumlah stiker diunduh');
    console.error('  --no-replies    lewati pindaian balasan komentar');
    console.error('  --delay=MS      jeda antar request (default 220)');
    console.error('  --out=DIR       folder keluaran (default ./output)');
    console.error('');
    console.error('Contoh:');
    console.error('  node scrape-stiker.js "https://vt.tiktok.com/ZSp1b8fPf/"');
    console.error('  node scrape-stiker.js "https://www.tiktok.com/@jawaposofficial/video/7703403438029245703" --limit=5');
    process.exit(1);
  }
  console.error(' === TikTok Stiker Komentar === ');
  const result = await scrapeTikTokStickers(args.url, {
    maxPages: args.maxPages,
    maxStickers: args.maxStickers,
    scanReplies: !args.noReplies,
    requestDelay: args.delay,
    outputDir: args.outDir || path.join(process.cwd(), 'output'),
    onProgress: printLog,
  });
  const resPath = result.video.video_id ? outputResultPath(args.outDir, result.video.video_id) : null;
  if (resPath) console.error(' result.json : ' + resPath);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.scrape.status === 'completed' ? 0 : 1;
}

function outputResultPath(outDir, videoId) {
  return path.join(outDir || 'output', videoId, 'result.json');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[x] fatal: ' + err.stack);
    process.exit(1);
  });
}

module.exports = {
  scrapeTikTokStickers,
  resolveTikTokUrl,
  fetchVideoInfo,
  classifyBuffer,
  extractStickerFromComment,
  outputResultPath,
  UA_POOL,
};
