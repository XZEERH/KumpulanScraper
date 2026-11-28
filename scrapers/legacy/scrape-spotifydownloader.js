#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Downloader
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web :https://spotidown.app/id7
 * Type : Scraper
 * Description :Download musik spotify
Note : Link MP3 dari SpotiDown memiliki masa aktif 1 jam ygy, btw Error fix sendiri
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');

const SITE = 'https://spotidown.app';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
];

const DEFAULTS = Object.freeze({
  timeout: 45000,
  retries: 12,
  limit: 10,
  verify: true,
  out: 'result.json',
  log: null
});

class Warn {
  constructor(log) { this.log = log; }
  w(msg) { if (this.log) { try { this.log('[spotidown] ' + msg); } catch (_) {} } }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad2(v) {
  return String(v).padStart(2, '0');
}

function fmtTime(dur) {
  if (typeof dur === 'number' && Number.isFinite(dur)) {
    const h = Math.floor(dur / 3600);
    const m = Math.floor((dur % 3600) / 60);
    const s = Math.floor(dur % 60);
    return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
  }
  if (typeof dur !== 'string' || !dur.includes(':')) return '';
  const parts = dur.split(':').map((p) => p.trim());
  if (parts.some((p) => p === '')) return dur;
  if (parts.length === 2) return `${pad2(parts[0])}:${pad2(parts[1])}`;
  if (parts.length === 3) return `${parts[0]}:${pad2(parts[1])}:${pad2(parts[2])}`;
  return dur;
}

const CATEGORIES = ['track', 'album', 'playlist', 'episode'];

function normalizeInput(raw) {
  const input = String(raw == null ? '' : raw).trim().replace(/^["']|["']$/g, '');
  const httpMatch = input.match(/(?:https?:\/\/)?(?:www\.|open\.|embed\.)?(?:open\.spotify\.com|spotify\.link)\/[^\s]+/i);
  if (httpMatch) {
    const rawUrl = 'https://' + httpMatch[0].replace(/^https?:\/\//i, '');
    let parsed;
    try { parsed = new URL(rawUrl); } catch (_) { /* notch */ }
    if (!parsed) return { type: 'query', value: input, label: input };
    const m = parsed.pathname.match(/\/(?:intl-[a-z\-]+\/)?(track|album|playlist|episode)\/([a-zA-Z0-9]{22})/i);
    if (m) {
      const kind = m[1].toLowerCase();
      return { type: kind, value: `https://open.spotify.com/${kind}/${m[2]}`, label: input };
    }
    if (/spotify\.link$/i.test(parsed.hostname)) {
      return { type: 'shortlink', value: parsed.href, label: input };
    }
    return { type: 'query', value: input, label: input };
  }
  const uri = input.match(/^spotify:(track|album|playlist|episode):([a-zA-Z0-9]{22})$/i);
  if (uri) {
    const kind = uri[1].toLowerCase();
    return { type: kind, value: `https://open.spotify.com/${kind}/${uri[2]}`, label: input };
  }
  const bare = input.match(/(?:^|[\s/"'])(track|album|playlist|episode)[/:]+([a-zA-Z0-9]{22})(?:[\s/"']|$)/i);
  if (bare) {
    const kind = bare[1].toLowerCase();
    return { type: kind, value: `https://open.spotify.com/${kind}/${bare[2]}`, label: input };
  }
  const id22 = input.match(/^([a-zA-Z0-9]{22})$/);
  if (id22) return { type: 'track', value: `https://open.spotify.com/track/${id22[1]}`, label: input };
  if (input) return { type: 'query', value: input, label: input };
  return null;
}

async function resolveShortlink(client, target, warn) {
  try {
    const r = await client.get(target.value, { maxRedirects: 5, timeout: 20000 });
    const finalUrl = r.request && r.request.res && r.request.res.responseUrl ? r.request.res.responseUrl : (r.config && r.config.url);
    const m = String(finalUrl || '').match(/\/(?:intl-[a-z\-]+\/)?(track|album|playlist|episode)\/([a-zA-Z0-9]{22})/i);
    if (m) return { type: m[1].toLowerCase(), value: `https://open.spotify.com/${m[1].toLowerCase()}/${m[2]}`, label: target.label };
    throw new Error('shortlink target not parsed: ' + finalUrl);
  } catch (e) {
    warn.w('shortlink resolve gagal (' + e.message + '), pola ditunda');
    return null;
  }
}

function newSession() {
  const jar = new Map();
  return {
    header() { return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; '); },
    store(headers) {
      const set = headers && headers['set-cookie'];
      if (!set) return;
      for (const line of [].concat(set)) {
        const m = String(line).match(/^([^=;\s]+)\s*=\s*([^;]*)/);
        if (!m) continue;
        const name = m[1].toLowerCase();
        const value = m[2];
        if (value === '' || /expires=\w+,\s*\d{2}\s+\w+\s+\d{2}.*(1970|GMT\s*$)/i.test(line)) jar.delete(name);
        else jar.set(name, value);
      }
    },
  };
}

function makeClient(session, ua, timeout) {
  const client = axios.create({ timeout, maxRedirects: 5, validateStatus: (s) => s >= 200 && s < 500 });
  client.interceptors.request.use((cfg) => {
    cfg.headers = cfg.headers || {};
    cfg.headers['user-agent'] = ua;
    const ck = session.header();
    if (ck) cfg.headers['cookie'] = ck;
    return cfg;
  });
  client.interceptors.response.use((r) => {
    try { session.store(r.headers); } catch (_) { /* noop */ }
    return r;
  });
  return client;
}

function ajaxHeaders(extra) {
  return Object.assign({
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'x-requested-with': 'XMLHttpRequest',
    'origin': SITE,
    'referer': SITE + '/en7'
  }, extra || {});
}

async function dlAction(client, url) {
  const { data: json } = await client.post(
    SITE + '/action',
    new URLSearchParams({ url, 'g-recaptcha-response': '' }).toString(),
    ajaxHeaders({ 'content-type': 'application/x-www-form-urlencoded' })
  );
  return json;
}

function decodeTrackData(b64) {
  try {
    return JSON.parse(Buffer.from(String(b64), 'base64').toString('utf8'));
  } catch (_) {
    return null;
  }
}

function parseTrackRows(html) {
  const $ = cheerio.load(String(html));
  const out = [];
  $('form[name="submitspurl"]').each((_, form) => {
    const f = $(form);
    const dataB64 = f.find('input[name="data"]').attr('value');
    if (!dataB64) return;
    const info = decodeTrackData(dataB64) || {};
    out.push({
      data: dataB64,
      base: (f.find('input[name="base"]').attr('value') || '').trim(),
      token: (f.find('input[name="token"]').attr('value') || '').trim(),
      name: info.name || '',
      artist: info.artist || '',
      album: info.album || '',
      cover: info.cover || '',
      duration: fmtTime(info.duration || ''),
      tid: info.tid || ''
    });
  });
  return out;
}

async function killStream(resp) {
  try {
    if (resp && resp.data && typeof resp.data.destroy === 'function') resp.data.destroy();
  } catch (_) { /* */ }
  try {
    if (resp && resp.request && typeof resp.request.abort === 'function') resp.request.abort();
  } catch (_) { /* */ }
}

function isMp3Magic(buf) {
  if (!buf || buf.length < 3) return false;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
  return false;
}

async function verifyMp3(client, url, warn) {
  let resp = null;
  try {
    resp = await client.get(url, {
      responseType: 'stream',
      timeout: 25000,
      maxRedirects: 5,
      headers: { referer: SITE + '/', accept: '*/*' }
    });
    const chunks = [];
    let size = 0;
    await new Promise((resolve) => {
      resp.data.on('data', (c) => {
        chunks.push(c);
        size += c.length;
        if (size >= 65536) { killStream(resp); resolve(); }
      });
      resp.data.on('end', resolve);
      resp.data.on('error', () => resolve());
    });
    const buf = Buffer.concat(chunks).subarray(0, 256);
    const ctype = String(resp.headers['content-type'] || '').toLowerCase();
    const ok = isMp3Magic(buf) || ctype.includes('audio') || ctype.includes('octet-stream') || ctype.includes('mpeg');
    if (!ok) {
      warn.w('mp3 verify: anomali jawaban type=' + ctype + ' head=' + buf.subarray(0, 16).toString('hex'));
      return false;
    }
    return true;
  } catch (e) {
    warn.w('verify mp3 dilewati karena error network (' + (e && e.message ? e.message : e) + ')');
    return true;
  } finally {
    killStream(resp);
  }
}

async function extractDownloadUrl(client, entry, warn) {
  const fd = new FormData();
  fd.append('data', entry.data);
  fd.append('base', entry.base || '');
  fd.append('token', entry.token || '');
  const { data: json } = await client.post(SITE + '/action/track', fd, ajaxHeaders());
  if (!json || typeof json !== 'object' || json.error) {
    const msg = (json && json.message) || 'track endpoint refused';
    throw new Error(msg);
  }
  const html = json.data || '';
  if (!html) throw new Error('track endpoint returned empty html');
  const $f = cheerio.load(html);
  let href = '';
  $f('a').each((_, a) => {
    if (href) return;
    const $a = $f(a);
    const text = ($a.text() || '').trim();
    const u = $a.attr('href') || '';
    if (/download\s*mp3/i.test(text) && /token=/.test(u)) href = u;
  });
  if (!href) {
    $f('a').each((_, a) => {
      if (href) return;
      const u = $f(a).attr('href') || '';
      if (/^(https:\/\/)?rapid\.spotidown\.app\/.*/i.test(u)) href = u;
    });
  }
  if (!href) {
    const any = $f('a[href*="token="]').attr('href') || '';
    if (any) href = any;
  }
  if (!href || href === '#') throw new Error('no mp3 link found in final page');
  return href;
}

async function paginate(client, firstHtml, warn) {
  let $ = cheerio.load(String(firstHtml));
  let rows = parseTrackRows(String(firstHtml));
  let guard = 0;
  while (guard < 60) {
    guard += 1;
    const more = $('#load-more');
    if (!more.length) break;
    const offset = Number(more.attr('data-offset') || '-1');
    const lurl = more.attr('data-url') || '';
    const ltoken = more.attr('data-token') || '';
    if (!Number.isInteger(offset) || offset < 0 || !lurl) break;
    warn.w('pagination: loading offset ' + offset);
    const fd = new FormData();
    fd.append('url', lurl);
    fd.append('token', ltoken);
    fd.append('offset', String(offset));
    try {
      const { data: chunk } = await client.post(SITE + '/action/offset', fd, ajaxHeaders());
      if (!chunk || typeof chunk !== 'string' || chunk.trim() === '') break;
      const added = parseTrackRows(chunk);
      if (!added.length) break;
      const seen = new Set(rows.map((r) => r.tid + '|' + r.name));
      const fresh = added.filter((r) => !seen.has(r.tid + '|' + r.name));
      rows = rows.concat(fresh);
      if (!fresh.length) break;
      $ = cheerio.load(chunk);
    } catch (e) {
      warn.w('pagination offset ' + offset + ' gagal: ' + e.message);
      break;
    }
  }
  return rows;
}

async function pipelineOnce(target, opts, warn) {
  const session = newSession();
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const client = makeClient(session, ua, opts.timeout);

  try { await client.get(SITE + '/', { headers: { accept: 'text/html,application/xhtml+xml' } }); }
  catch (e) { warn.w('seed page gagal (' + e.message + '), lanjut tanpa cookie pertama'); }

  let input = { type: target.type, value: target.value, label: target.label };
  if (input.type === 'shortlink') {
    const resolved = await resolveShortlink(client, input, warn);
    if (resolved) input = resolved;
  }

  const json = await dlAction(client, input.value);
  if (!json || typeof json !== 'object' || json.error !== false) {
    throw new Error((json && json.message) || 'Gagal mengambil data dari SpotiDown');
  }

  const rows = await paginate(client, json.data || '', warn);
  if (!rows.length) throw new Error('daftar track kosong (no tracks found)');
  warn.w('diparse ' + rows.length + ' entri via ' + (input.type === 'query' ? 'pencarian' : input.type));

  let wanted = rows.slice();
  if (target.type === 'track' || target.type === 'episode') {
    wanted = rows.slice(0, 1);
  } else {
    wanted = rows.slice(0, Math.max(1, Math.min(Number(opts.limit) || 1, rows.length)));
  }

  const results = [];
  let primary = null;
  for (let i = 0; i < wanted.length; i++) {
    const entry = wanted[i];
    try {
      const mp3 = await extractDownloadUrl(client, entry, warn);
      if (opts.verify) {
        const ok = await verifyMp3(client, mp3, warn);
        if (!ok) throw new Error('verifikasi mp3 tidak lolos');
      }
      const item = {
        name_music: entry.name || '',
        author: entry.artist || '',
        time: entry.duration || '',
        url_audio_mp3: mp3
      };
      if (!primary) primary = item;
      results.push(item);
      if (i + 1 < wanted.length) await sleep(400);
    } catch (e) {
      warn.w('entry "' + entry.name + '" gagal: ' + e.message + ' -> dilewati');
      if (wanted.length === 1) throw new Error(e.message);
    }
  }

  if (!primary) throw new Error('tidak ada hasil download yang berhasil');

  if (results.length === 1) {
    return { status: true, name_music: primary.name_music, author: primary.author, time: primary.time, url_audio_mp3: primary.url_audio_mp3 };
  }
  return {
    status: true,
    source: input.type,
    total: results.length,
    name_music: primary.name_music,
    author: primary.author,
    time: primary.time,
    url_audio_mp3: primary.url_audio_mp3,
    tracks: results
  };
}

function finalFailure(message, extra) {
  return Object.assign({ status: false }, extra || {}, { message: String(message || 'unknown error') });
}

async function spotifyDownloader(input, options) {
  const opts = Object.assign({}, DEFAULTS, options || {});
  const warn = new Warn(typeof opts.log === 'function' ? opts.log : null);
  const target = normalizeInput(input);
  if (!target) throw new Error('buatkan target tidak valid');

  let attempt = 0;
  let lastError = '';
  while (attempt < opts.retries) {
    attempt += 1;
    try {
      warn.w('percobaan #' + attempt + ' -> ' + target.type + ' ' + target.value);
      const result = await pipelineOnce(target, opts, warn);
      warn.w('berhasil pada percobaan #' + attempt);
      return result;
    } catch (e) {
      lastError = e.message || String(e);
      warn.w('percobaan #' + attempt + ' gagal: ' + lastError);
      if (attempt < opts.retries) {
        const waitMs = Math.min(12000, 1200 * Math.pow(attempt, 1.6));
        warn.w('retry dalam ' + Math.round(waitMs / 1000) + 's...');
        await sleep(waitMs);
      }
    }
  }
  return finalFailure(lastError);
}

function parseArgv(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') args.limit = Number(argv[++i]);
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--retries') args.retries = Number(argv[++i]);
    else if (a === '--timeout') args.timeout = Number(argv[++i]);
    else if (a === '--verify') args.verify = true;
    else if (a === '--no-verify') args.verify = false;
    else if (a === '--verbose') args.log = console.error;
    else if (a === '--help') args.help = true;
    else if (a && !a.startsWith('--')) args._.push(a);
  }
  return args;
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgv(argv);
  if (args.help || !args._.length) {
    process.stdout.write('Usage: node scrape-spotifydownloader.js "<spotify url|search>" [--limit 10] [--out result.json] [--no-verify] [--retries 12] [--timeout 45000] [--verbose]\nOutput: result.json + JSON ke stdout\n');
    const r = finalFailure(args.help ? 'tidak ada input url' : 'no input url', args.help ? { usage: true } : {});
    process.stdout.write(JSON.stringify(r, null, 2) + '\n');
    process.exitCode = args.help ? 0 : 1;
    return;
  }

  const input = args._[0];
  const opts = {
    timeout: Number.isFinite(args.timeout) ? args.timeout : DEFAULTS.timeout,
    retries: Number.isFinite(args.retries) && args.retries > 0 ? args.retries : DEFAULTS.retries,
    limit: Number.isFinite(args.limit) && args.limit > 0 ? args.limit : DEFAULTS.limit,
    verify: args.verify !== false,
    out: args.out || DEFAULTS.out,
    log: args.log || null
  };

  const started = Date.now();
  const result = await spotifyDownloader(input, opts);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  const outPath = path.isAbsolute(opts.out) ? opts.out : path.join(process.cwd(), opts.out);
  try { fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n'); } catch (_) { process.stderr.write('[spotidown] gagal menulis file out ' + opts.out + '\n'); }

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.stderr.write('[spotidown] selesai ' + elapsed + 's -> ' + outPath + '\n');
  process.exitCode = result && result.status ? 0 : 1;
}

module.exports = {
  spotifyDownloader,
  spotifyDownload: spotifyDownloader,
  normalizeInput,
  fmtTime,
  parseTrackRows,
  DEFAULTS
};

if (require.main === module) {
  main().catch((e) => {
    const fail = finalFailure(e && e.message ? e.message : 'fatal');
    process.stdout.write(JSON.stringify(fail, null, 2) + '\n');
    try { fs.writeFileSync(path.join(process.cwd(), 'result.json'), JSON.stringify(fail, null, 2) + '\n'); } catch (_) { /* */ }
    process.exitCode = 1;
  });
}
