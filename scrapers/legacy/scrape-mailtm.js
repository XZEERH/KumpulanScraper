#!/usr/bin/env node

/**
 * Name : mailtm (buat email sementara)
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://mail.tm/
 * Type : Scraper
 * Description : Mailtm adalah layanan email sementara yang memungkinkan pengguna mendapatkan alamat email sekali pakai untuk menerima pesan, kode verifikasi, dan lampiran tanpa menggunakan email pribadi.
 * Note : error fix sendiri
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');
const axios = require('axios');

const BASE = (process.env.MAILTM_API_BASE || 'https://api.mail.tm').replace(/\/+$/, '');

const OTP_KEYWORDS = [
  'otp', 'one-time', 'one time', 'kode', 'code', 'verifikasi', 'verification',
  'passcode', 'pin', 'token', 'confirm', 'konfirmasi', 'kode masuk', 'login code',
];
const LINK_KEYWORDS = ['verify', 'confirm', 'activate', 'validate', 'magic',
  'verifikasi', 'konfirmasi', 'aktif', 'code', 'kode', 'auth', 'unlock', 'signin'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------- util ------------------------------- */

function htmlToText(html) {
  if (!html || typeof html !== 'string') return '';
  const $ = cheerio.load(html, { decodeEntities: true });
  $('script, style, head, noscript').remove();
  $('br').replaceWith('\n');
  $('p, div, tr, li, h1, h2, h3, h4, h5, h6, table, blockquote').each((_, el) => {
    $(el).append('\n');
  });
  return $.root().text()
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

function extractLinks(html) {
  if (!html || typeof html !== 'string') return [];
  const $ = cheerio.load(html);
  const kwRe = new RegExp(LINK_KEYWORDS.join('|'), 'i');
  const out = [];
  const seen = new Set();
  $('a[href]').each((_, el) => {
    const url = ($(el).attr('href') || '').trim();
    if (!/^https?:\/\//i.test(url) || seen.has(url)) return;
    seen.add(url);
    const text = ($(el).text() || '').trim().slice(0, 120);
    let sig = url;
    try { const u = new URL(url); sig = u.pathname + u.search; } catch (_) {}
    out.push({ url, text, looksLikeVerification: kwRe.test(sig) || kwRe.test(text) });
  });
  return out;
}

function extractOtp(text, html) {
  const haystacks = [text || '', htmlToText(html || '')];
  const candidates = new Set();
  const scored = [];
  const codes = /\b(\d{4,8})\b/g;
  for (const hay of haystacks) {
    if (!hay) continue;
    const lower = hay.toLowerCase();
    let m;
    codes.lastIndex = 0;
    while ((m = codes.exec(hay)) !== null) {
      const code = m[1];
      candidates.add(code);
      const start = Math.max(0, m.index - 60);
      const win = lower.slice(start, m.index + code.length + 30);
      let score = 0;
      for (const kw of OTP_KEYWORDS) if (win.includes(kw)) score += 2;
      if (code.length === 6) score += 1;
      scored.push({ code, score });
    }
  }
  scored.sort((a, b) => b.score - a.score || b.code.length - a.code.length);
  const best = scored.find((s) => s.score > 0) || scored[0] || null;
  return { code: best ? best.code : null, candidates: [...candidates] };
}

function formatSize(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function randomPassword(len = 16) {
  return crypto.randomBytes(len).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, len);
}

function normAddr(addr) {
  const value = (addr || '').trim();
  if (!value) return { name: null, address: null };
  const m = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || null, address: m[2].trim().toLowerCase() };
  return { name: null, address: value.toLowerCase() };
}

/* ------------------------------ client ------------------------------ */

let HTTP_TIMEOUT = 45000;

function makeApi(token) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return axios.create({ baseURL: BASE, timeout: HTTP_TIMEOUT, headers, validateStatus: () => true });
}

function asList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data['hydra:member'])) return data['hydra:member'];
  if (Array.isArray(data.member)) return data.member;
  return [];
}

async function listDomains() {
  const r = await makeApi().get('/domains');
  if (r.status >= 400) throw apiError('GET /domains', r);
  return asList(r.data).map((d) => d.domain);
}

async function createAccount(address, password) {
  const r = await makeApi().post('/accounts', { address, password });
  if (r.status >= 400) throw apiError('POST /accounts', r);
  return r.data;
}

async function login(address, password) {
  const r = await makeApi().post('/token', { address, password });
  if (r.status >= 400) throw apiError('POST /token', r);
  return r.data; // { token, id }
}

async function getMe(api) {
  const r = await api.get('/me');
  if (r.status >= 400) throw apiError('GET /me', r);
  return r.data;
}

async function listMessages(api) {
  const r = await api.get('/messages');
  if (r.status >= 400) throw apiError('GET /messages', r);
  return asList(r.data);
}

async function getMessage(api, id) {
  const r = await api.get(`/messages/${id}`);
  if (r.status >= 400) throw apiError(`GET /messages/${id}`, r);
  return r.data;
}

async function markRead(api, id) {
  const r = await api.patch(`/messages/${id}`, { seen: true }, { headers: { 'Content-Type': 'application/merge-patch+json' } });
  if (r.status >= 400) throw apiError(`PATCH /messages/${id}`, r);
  return r.data;
}

async function deleteMessage(api, id) {
  const r = await api.delete(`/messages/${id}`);
  if (r.status >= 400) throw apiError(`DELETE /messages/${id}`, r);
  return true;
}

async function deleteAccount(api, id) {
  const r = await api.delete(`/accounts/${id}`);
  if (r.status >= 400) throw apiError(`DELETE /accounts/${id}`, r);
  return true;
}

async function fetchHtmlBody(api, urls, opts) {
  const parts = [];
  for (const u of urls || []) {
    const url = /^https?:\/\//i.test(u) ? u : BASE + u;
    const r = await api.get(url, { validateStatus: () => true, headers: { Accept: 'text/html,application/xhtml+xml' } });
    if (r.status < 400 && typeof r.data === 'string') parts.push(r.data);
  }
  return parts.join('\n<!-- --- -->\n');
}

async function downloadAttachment(api, url, dir, filename) {
  const full = /^https?:\/\//i.test(url) ? url : BASE + url;
  const r = await api.get(full, { responseType: 'arraybuffer', validateStatus: () => true });
  if (r.status >= 400) throw apiError('GET attachment', r);
  fs.mkdirSync(dir, { recursive: true });
  const safe = (filename || `att-${Date.now()}`).replace(/[^\w.\-]+/g, '_');
  const dest = path.join(dir, safe);
  fs.writeFileSync(dest, Buffer.from(r.data));
  return dest;
}

function apiError(what, r) {
  const detail = (r.data && (r.data.detail || r.data['hydra:description'] || r.data.message)) || null;
  const err = new Error(`${what} -> HTTP ${r.status}${detail ? ': ' + detail : ''}`);
  err.status = r.status;
  err.raw = r.data;
  err.kind = r.status === 401 ? 'unauth' : r.status === 429 ? 'ratelimited' : r.status === 422 ? 'validation' : 'http';
  return err;
}

/* --------------------------- normalization -------------------------- */

async function normalizeMessage(api, raw, opts) {
  let m = raw;
  let html = '';
  let text = raw.text || '';
  let attachments = raw.attachments || [];
  let links = [];
  let otp = { code: null, candidates: [] };

  if (opts.details) {
    try {
      m = await getMessage(api, raw.id);
      text = m.text || text;
      attachments = m.attachments || [];
      if (opts.fetchHtml !== false && Array.isArray(m.html) && m.html.length) {
        html = await fetchHtmlBody(api, m.html, opts);
        if (!text) text = htmlToText(html);
        links = extractLinks(html);
        otp = extractOtp(text, html);
      } else {
        otp = extractOtp(text, '');
      }
    } catch (e) {
      otp = extractOtp(text, '');
    }
  } else {
    otp = extractOtp(text, '');
  }
  if (!links.length && html) links = extractLinks(html);

  const from = normAddr((raw.from && (raw.from.name ? `"${raw.from.name}" <${raw.from.address}>` : raw.from.address)) || '');
  const toList = (m.to || raw.to || []).map((t) => t.address || t);

  return {
    id: raw.id,
    msgid: raw.msgid || null,
    from,
    to: toList,
    subject: raw.subject || null,
    intro: raw.intro || null,
    seen: raw.seen === true,
    flagged: raw.flagged === true,
    hasAttachments: raw.hasAttachments === true || attachments.length > 0,
    size: raw.size != null ? raw.size : null,
    sizeHuman: formatSize(raw.size),
    receivedAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
    text: text || null,
    html: opts.keepHtmlUrls ? (m.html || raw.html || []) : undefined,
    otp: otp.code,
    otpCandidates: otp.candidates,
    links,
    attachments: (attachments || []).map((a) => ({
      id: a.id,
      filename: a.filename || null,
      contentType: a.contentType || null,
      size: a.size != null ? a.size : null,
      sizeHuman: formatSize(a.size),
      downloadUrl: /^https?:\/\//i.test(a.downloadUrl || '') ? a.downloadUrl : (a.downloadUrl ? BASE + a.downloadUrl : null),
    })),
  };
}

/* ------------------------------- CLI -------------------------------- */

function parseArgs(argv) {
  const o = {
    create: false, address: null, password: null, token: null, domain: null,
    watch: false, interval: 5, maxtries: 1, maxtriesSet: false,
    details: true, fetchHtml: true, keepHtmlUrls: false,
    otpOnly: false, markRead: false,
    downloadAttachments: null,
    deleteMessage: null, deleteAccount: false,
    save: null, load: null, timeout: 45000, quiet: false, compact: false,
  };
  const need = (v, flag) => { if (v === undefined) throw new Error(`Opsi ${flag} butuh nilai`); return v; };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => need(argv[++i], a);
    switch (a) {
      case '--create': o.create = true; break;
      case '--address': o.address = next(); break;
      case '--password': o.password = next(); break;
      case '--token': o.token = next(); break;
      case '--domain': o.domain = next(); break;
      case '--watch': o.watch = true; break;
      case '--interval': o.interval = Number(next()); break;
      case '--maxtries': o.maxtries = Number(next()); o.maxtriesSet = true; break;
      case '--details': o.details = true; break;
      case '--no-details': o.details = false; break;
      case '--fetch-html': o.fetchHtml = true; break;
      case '--no-fetch-html': o.fetchHtml = false; break;
      case '--keep-html-urls': o.keepHtmlUrls = true; break;
      case '--otp-only': o.otpOnly = true; break;
      case '--mark-read': o.markRead = true; break;
      case '--download-attachments': o.downloadAttachments = next(); break;
      case '--delete-message': o.deleteMessage = next(); break;
      case '--delete-account': o.deleteAccount = true; break;
      case '--save': o.save = next(); break;
      case '--load': o.load = next(); break;
      case '--timeout': o.timeout = Number(next()); break;
      case '--compact': o.compact = true; break;
      case '--quiet': o.quiet = true; break;
      case '--help': case '-h': o.help = true; break;
      default:
        if (a.startsWith('-')) throw new Error(`Opsi tak dikenal: ${a}`);
    }
  }
  return o;
}

const HELP = `scrape-mailtm.js — scraper email sementara mail.tm (JSON, tanpa Cloudflare)

Pakai: node scrape-mailtm.js [opsi]

Akun:
  --create                 buat mailbox baru (default bila tak ada kredensial)
  --address <addr>         pakai alamat tertentu
  --password <pw>          sandi (auto-generate bila --create)
  --token <jwt>            pakai token yang sudah ada
  --domain <domain>        pilih domain (lihat GET /domains)
  --save <file>            simpan kredensial akun ke file
  --load <file>            muat kredensial dari file

Output:
  --watch                  pantau terus pesan baru (JSONL)
  --interval <detik>       jeda polling (default 5)
  --maxtries <n>           batas percobaan polling
  --otp-only               hanya pesan yang mengandung OTP
  --details / --no-details ambil body lengkap (default: ya)
  --fetch-html             ambil body HTML (default: ya)
  --keep-html-urls         sertakan URL body HTML di output
  --mark-read              tandai pesan sudah dibaca
  --compact                JSON satu baris

Aksi:
  --download-attachments <dir>  unduh semua lampiran
  --delete-message <id>    hapus pesan
  --delete-account         hapus akun
  --timeout <ms>           timeout HTTP (default 45000)
`;

function emit(obj, opts) {
  const json = opts.compact ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);
  process.stdout.write(json + '\n');
}
function diag(opts, msg) { if (!opts.quiet) process.stderr.write(msg + '\n'); }

/* ------------------------------- main ------------------------------- */

async function ensureCredentials(opts) {
  if (opts.load && fs.existsSync(opts.load)) {
    const saved = JSON.parse(fs.readFileSync(opts.load, 'utf8'));
    opts.address = opts.address || saved.address;
    opts.password = opts.password || saved.password;
    opts.token = opts.token || saved.token;
  }
  if (opts.token && opts.address) return;

  if (!opts.address) {
    const domains = await listDomains();
    if (!domains.length) throw new Error('Tidak ada domain aktif dari mail.tm');
    const domain = opts.domain || domains[0];
    if (opts.domain && !domains.includes(opts.domain)) {
      diag(opts, `[i] Domain "${opts.domain}" tak terdaftar. Domain tersedia: ${domains.join(', ')}`);
    }
    const local = 'tmp' + crypto.randomBytes(5).toString('hex');
    opts.address = `${local}@${domain}`;
  }
  if (!opts.password) opts.password = randomPassword();

  if (!opts.token) {
    try {
      await createAccount(opts.address, opts.password);
      diag(opts, `[i] Mailbox dibuat: ${opts.address}`);
    } catch (e) {
      if (e.kind === 'validation') {
        diag(opts, `[i] Alamat sudah terpakai / tak valid, mencoba login: ${opts.address}`);
      } else {
        throw e;
      }
    }
    const t = await login(opts.address, opts.password);
    opts.token = t.token;
  }
}

function saveCreds(opts) {
  if (!opts.save) return;
  fs.writeFileSync(opts.save, JSON.stringify({
    provider: 'mail.tm', address: opts.address, password: opts.password, token: opts.token,
    savedAt: new Date().toISOString(),
  }, null, 2));
  diag(opts, `[i] Kredensial disimpan: ${opts.save}`);
}

async function runOnce(opts) {
  const api = makeApi(opts.token);
  const me = await getMe(api).catch(() => null);
  const list = await listMessages(api);

  const messages = [];
  for (const raw of list) {
    const nm = await normalizeMessage(api, raw, opts);
    if (opts.otpOnly && !nm.otp) continue;
    if (opts.markRead && !nm.seen) { try { await markRead(api, nm.id); nm.seen = true; } catch (_) {} }
    if (opts.downloadAttachments && nm.attachments.length) {
      for (let idx = 0; idx < nm.attachments.length; idx++) {
        const a = nm.attachments[idx];
        try { a.savedTo = await downloadAttachment(api, a.downloadUrl, opts.downloadAttachments, a.filename || `${nm.id}-${idx}`); }
        catch (e) { a.savedTo = null; a.saveError = e.message; }
      }
    }
    messages.push(nm);
  }

  return {
    ok: true,
    provider: 'mail.tm',
    mailbox: {
      address: opts.address,
      domain: opts.address ? opts.address.split('@')[1] : null,
      password: opts.password || null,
      token: opts.token || null,
      id: me ? me.id : null,
      quota: me ? me.quota : null,
      used: me ? me.used : null,
      isDisabled: me ? !!me.isDisabled : null,
    },
    count: messages.length,
    unread: messages.filter((x) => !x.seen).length,
    messages,
  };
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { process.stdout.write(HELP); return; }
  if (Number.isFinite(opts.timeout) && opts.timeout > 0) HTTP_TIMEOUT = opts.timeout;

  if (opts.deleteAccount) {
    await ensureCredentials(opts);
    const api = makeApi(opts.token);
    const me = await getMe(api);
    await deleteAccount(api, me.id);
    emit({ ok: true, provider: 'mail.tm', action: 'delete-account', address: opts.address, id: me.id }, opts);
    return;
  }
  if (opts.deleteMessage) {
    await ensureCredentials(opts);
    const api = makeApi(opts.token);
    await deleteMessage(api, opts.deleteMessage);
    emit({ ok: true, provider: 'mail.tm', action: 'delete-message', id: opts.deleteMessage }, opts);
    return;
  }

  await ensureCredentials(opts);
  saveCreds(opts);

  if (opts.watch) {
    if (!opts.maxtriesSet) opts.maxtries = Infinity;
    let seen = new Set();
    let tries = 0;
    diag(opts, `[i] Memantau ${opts.address} tiap ${opts.interval}s (Ctrl+C untuk berhenti)...`);
    for (;;) {
      if (tries >= opts.maxtries) break;
      tries++;
      let list;
      try { list = await listMessages(makeApi(opts.token)); }
      catch (e) { diag(opts, `[!] ${e.message}`); await sleep(opts.interval * 1000); continue; }
      const api = makeApi(opts.token);
      for (const raw of list) {
        if (seen.has(raw.id)) continue;
        seen.add(raw.id);
        const nm = await normalizeMessage(api, raw, opts);
        if (opts.otpOnly && !nm.otp) continue;
        if (opts.markRead && !nm.seen) { try { await markRead(api, nm.id); nm.seen = true; } catch (_) {} }
        if (opts.downloadAttachments && nm.attachments.length) {
          for (let idx = 0; idx < nm.attachments.length; idx++) {
            const a = nm.attachments[idx];
            try { a.savedTo = await downloadAttachment(api, a.downloadUrl, opts.downloadAttachments, a.filename || `${nm.id}-${idx}`); }
            catch (e) { a.savedTo = null; a.saveError = e.message; }
          }
        }
        emit({ ok: true, provider: 'mail.tm', event: 'message', mailbox: { address: opts.address }, message: nm }, opts);
      }
      await sleep(opts.interval * 1000);
    }
    return;
  }

  const result = await runOnce(opts);
  emit(result, opts);
}

run().catch((e) => {
  const out = { ok: false, provider: 'mail.tm', error: { kind: e.kind || 'error', message: e.message, status: e.status || null } };
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  process.exitCode = 1;
});