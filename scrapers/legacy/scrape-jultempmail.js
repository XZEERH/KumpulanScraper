#!/usr/bin/env node
"use strict";

/**
 * Name : Tempmail (Scrape web nya si julexce, dia sendiri yang minta scrape in 🗿)
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://julzaexce.my.id/tempmail
 * Type : Scraper
 * Description : Julzaexce Temp Mail berfungsi untuk membuat alamat email sementara, memeriksa inbox, mengambil informasi email masuk seperti pengirim, subjek, waktu diterima, dan isi pesan.
 * Note : proxy situs tidak punya route DELETE (404), frontend menghapus langsung ke backend Cloudflare Worker. Detail pesan inline di messages (id, sender, subject, received_at unix detik, text_body, html_body) tidak ada pagination kesalahan kustom. (Semua sudah terverifikasi, jika 409 itu menandakan nama email dipakai / validasi, jika 404 email sudah kedaluwarsa).

Btw sedikit informasi. Di beberapa jaringan, domain workers.dev diblokir. Ini di eksekusi menggunakan ISP via DNS hijack (CNAME ke blockpage.xlaxiata.id). Scraper, mendeteksi kegagalan lalu menyelesaikan DNS asli lewat DoH (cloudflare-dns.com / dns.google) dan menyambung ke IP asli
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const axios = require("axios");

/* ------------------------------------------------------------------ */
/* Konfigurasi dasar                                                    */
/* ------------------------------------------------------------------ */

const SITE_BASE = process.env.JULZ_BASE || "https://www.julzaexce.my.id";
const WORKER_BASE = process.env.JULZ_WORKER || "https://julz-tempmail.julykomang985.workers.dev";
const DOH_URLS = [
  "https://cloudflare-dns.com/dns-query?name={host}&type=A",
  "https://dns.google/resolve?name={host}&type=A",
];
const WORKER_HOST = new URL(WORKER_BASE).host;

const TIMEOUT_MS = parseInt(process.env.JULZ_TIMEOUT || "15000", 10);
const GET_RETRY = 2;          // sesuai frontend: 2 percobaan GET
const RETRY_DELAY_MS = 500;   // sesuai frontend
const SESSION_FILE = path.join(process.cwd(), "jul-tempmail-session.json");

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  Origin: SITE_BASE,
};

/* ------------------------------------------------------------------ */
/* Util umum                                                           */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function nowISO() {
  return new Date().toISOString();
}

function tagAddress(raw) {
  if (!raw || typeof raw !== "string") return { local: null, domain: null };
  const at = raw.lastIndexOf("@");
  if (at < 0) return { local: raw, domain: null };
  return { local: raw.slice(0, at) || null, domain: raw.slice(at + 1) || null };
}

function parseSender(raw) {
  const out = { name: null, address: null, raw: raw || null };
  if (typeof raw !== "string") return out;
  const m = raw.match(/^\s*(.*?)\s*<\s*([^<>\s]+@\S+?)\s*>\s*$/);
  if (m) {
    out.name = m[1].replace(/^"|"$/g, "").trim() || null;
    out.address = m[2];
    return out;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) {
    out.address = raw.trim();
    return out;
  }
  out.name = raw.trim();
  return out;
}

function humanDur(ms) {
  if (ms == null || !isFinite(ms)) return null;
  if (ms <= 0) return "0 detik";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const parts = [];
  if (d) parts.push(`${d} hari`);
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  else if (!d && !h && s) parts.push(`${s} detik`);
  return parts.join(" ") || "0 detik";
}

function snippet(text, max = 140) {
  if (typeof text !== "string") return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}

/** Algoritma ekstraksi tautan — port dari kode frontend (chunk 1-1_maki2afq3.js). */
function extractLinks(htmlBody, textBody) {
  const src = `${htmlBody || ""}\n${textBody || ""}`;
  const set = new Set();
  for (const m of src.matchAll(/href\s*=\s*["'](https?:\/\/[^"'<>\s]+)["']/gi)) set.add(m[1]);
  for (const m of src.matchAll(/https?:\/\/[^\s<>'"]+/gi)) set.add(m[0].replace(/[),.;]+$/, ""));
  return Array.from(set).filter((u) => {
    try {
      return new URL(u).protocol.startsWith("http");
    } catch {
      return false;
    }
  });
}

/** Info lampiran (service frontend tidak menangani lampiran, jadi
 *  dibaca defensif dari banyak kemungkinan nama field). */
function extractAttachments(m) {
  const keys = ["attachments", "attachmentCount", "attachment_count", "files", "fileCount"];
  for (const k of keys) {
    if (m && Object.prototype.hasOwnProperty.call(m, k) && m[k] != null) {
      const v = m[k];
      if (Array.isArray(v)) {
        if (v.length === 0) return { available: false, count: 0, items: [], sourceKey: k };
        return {
          available: true,
          count: v.length,
          items: v.map((a) => ({
            filename: (a && (a.filename || a.name || a.fileName)) || null,
            mimeType: (a && (a.type || a.mime || a.mimeType || a.contentType)) || null,
            sizeBytes: (a && (a.size || a.sizeBytes)) || null,
            url: (a && (a.url || a.downloadUrl || a.href)) || null,
          })),
          sourceKey: k,
        };
      }
      const n = Number(v);
      if (!isNaN(n)) return { available: n > 0, count: n, items: [], sourceKey: k };
    }
  }
  return { available: false, count: 0, items: [], sourceKey: null };
}

/* ------------------------------------------------------------------ */
/* Lapisan HTTP                                                        */
/* ------------------------------------------------------------------ */

function cleanApiError(res, data, type) {
  const map = {
    create: "Pembuatan inbox melewati batas waktu. Coba lagi sebentar.",
    inbox: "Server Temp Mail tidak merespons. Silakan segarkan lagi.",
    delete: "Server menghapus inbox tidak merespons. Coba lagi.",
  };
  const err = new Error((data && data.error) || map[type] || `Request gagal (${res.status})`);
  err.status = res.status;
  throw err;
}

function netError(err, type) {
  if (err && err.code === "ECONNABORTED") {
    return new Error(
      type === "create"
        ? "Pembuatan inbox melewati batas waktu. Coba lagi sebentar."
        : "Server Temp Mail tidak merespons (timeout). Silakan segarkan lagi."
    );
  }
  if (err && err instanceof Error) return err;
  return new Error("Koneksi sementara bermasalah");
}

/** GET dengan retry 2x mengikuti frontend. */
async function reqWithRetry(method, url, cfg, type) {
  const isGet = method === "GET";
  const maxTry = isGet ? GET_RETRY : 1;
  let lastErr;
  for (let i = 0; i < maxTry; i++) {
    try {
      const res = await axios.request({
        method,
        url,
        timeout: TIMEOUT_MS,
        headers: { ...DEFAULT_HEADERS, ...(cfg.headers || {}) },
        data: cfg.data,
        // jangan lempar otomatis; kita perlukan body untuk error mapping
        validateStatus: () => true,
      });
      const data = res.data;
      if (res.status >= 400) cleanApiError(res, data, type);
      return data;
    } catch (e) {
      if (e && e.status) throw e; // HTTP error non-retryable
      lastErr = netError(e, type);
      if (i < maxTry - 1) await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastErr || new Error("Koneksi sementara bermasalah");
}

/* --------------------- Bypass DNS hijack (workers.dev) ------------------- */

let cachedDoHIp = null;
let cachedDoHAt = 0;

async function resolveViaDoH(hostname) {
  if (cachedDoHIp && Date.now() - cachedDoHAt < 5 * 60 * 1000) return cachedDoHIp;
  for (const tpl of DOH_URLS) {
    try {
      const res = await axios.get(tpl.replace("{host}", hostname), {
        headers: { accept: "application/dns-json" },
        timeout: TIMEOUT_MS,
        validateStatus: () => true,
      });
      const answers = res.data && res.data.Answer;
      if (Array.isArray(answers)) {
        const ip = (answers.filter((a) => a.type === 1).map((a) => a.data).pop()) || null;
        if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
          cachedDoHIp = ip;
          cachedDoHAt = Date.now();
          return ip;
        }
      }
    } catch {
      /* coba provider DoH berikutnya */
    }
  }
  return null;
}

/** Agent yang menyambung ke IP hasil DoH tetapi SNI/cert tetap menyasar host asli. */
function dohAgent(ip) {
  return new https.Agent({
    keepAlive: false,
    lookup: (_host, _opts, cb) => cb(null, [{ address: ip, family: 4 }]),
  });
}

/** Panggil endpoint backend worker; otomatis fallback DoH bila
 *  koneksi normal gagal (DNS hijack / workers.dev diblokir). */
async function workerReq(method, urlPath, { data, headers } = {}, type = "inbox") {
  const try1 = async () => {
    const res = await axios.request({
      method,
      url: `${WORKER_BASE}${urlPath}`,
      timeout: TIMEOUT_MS,
      headers: { ...DEFAULT_HEADERS, ...(headers || {}) },
      data,
      validateStatus: () => true,
    });
    if (res.status >= 400) cleanApiError(res, res.data, type);
    return res.data;
  };
  try {
    return await try1();
  } catch (e) {
    // HTTP 4xx dari worker = error nyata, bukan masalah jaringan
    if (e && e.status) throw e;
    const ip = await resolveViaDoH(WORKER_HOST);
    if (!ip) throw netError(e, type);

    try {
      const res = await axios.request({
        method,
        url: `https://${WORKER_HOST}${urlPath}`,
        timeout: TIMEOUT_MS,
        headers: { ...DEFAULT_HEADERS, ...(headers || {}) },
        data,
        validateStatus: () => true,
        // pasang agent dengan resolver DoH
        httpsAgent: dohAgent(ip),
      });
      if (res.status >= 400) cleanApiError(res, res.data, type);
      return res.data;
    } catch (e2) {
      if (e2 && e2.status) throw e2;
      throw netError(e2, type);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Fungsi utama API                                                    */
/* ------------------------------------------------------------------ */

/** Buat inbox baru (acak bila name kosong; custom bila name diisi).
 *  Utama: proxy situs; cadangan: backend worker langsung. */
async function createInbox(name) {
  const body = {};
  if (name != null && name !== "") {
    body.name = String(name).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
  }
  const apiProxy = { method: "POST", endpoint: `${SITE_BASE}/api/tempmail/create`, body };
  const apiWorker = { method: "POST", endpoint: `${WORKER_BASE}/api/inbox`, body };
  try {
    const data = await reqWithRetry(
      "POST",
      `${SITE_BASE}/api/tempmail/create`,
      { data: body, headers: { "Content-Type": "application/json" } },
      "create"
    );
    return normalizeCreated(data, apiProxy);
  } catch (e) {
    if (e && e.status) throw e; // error validasi server: lempar apa adanya
    // jaringan/tidak terjangkau → coba backend worker langsung
    const data = await workerReq("POST", "/api/inbox", { data: body, headers: { "Content-Type": "application/json" } }, "create");
    return normalizeCreated(data, apiWorker);
  }
}

/** Ambil kotak masuk (list pesan + detail inline). Dipakai juga
 *  untuk tombol "Segarkan" di halaman. Cadangan: backend worker. */
async function getInbox(key) {
  const apiProxy = {
    endpoint: `${SITE_BASE}/api/tempmail/inbox?key=<TOKEN>`,
    method: "GET",
    params: { key: "token inbox" },
  };
  try {
    const data = await reqWithRetry(
      "GET",
      `${SITE_BASE}/api/tempmail/inbox?key=${encodeURIComponent(key)}`,
      {},
      "inbox"
    );
    return { raw: data, api: apiProxy };
  } catch (e) {
    if (e && e.status) throw e;
    const data = await workerReq("GET", `/api/inbox?key=${encodeURIComponent(key)}`, {}, "inbox");
    return {
      raw: data,
      api: { endpoint: `${WORKER_BASE}/api/inbox?key=<TOKEN>`, method: "GET", params: { key: "token inbox" } },
    };
  }
}

/** Hapus inbox via backend worker + Bearer token (persis frontend). */
async function deleteInbox(key) {
  const data = await workerReq(
    "DELETE",
    "/api/inbox",
    { headers: { Authorization: `Bearer ${key}` } },
    "delete"
  );
  // buktih: GET sesudah delete harusnya 404 kedaluwarsa
  let proof = null;
  try {
    await getInbox(key);
  } catch (e) {
    proof = { ok: e.status === 404, status: e.status || null, error: e.message };
  }
  return { delete: data, proof, api: { endpoint: `${WORKER_BASE}/api/inbox`, method: "DELETE", headers: { Authorization: "Bearer <TOKEN>" } } };
}

/* ------------------------------------------------------------------ */
/* Normalisasi output                                                  */
/* ------------------------------------------------------------------ */

function normalizeCreated(data, api) {
  const inbox = data.inbox || {};
  const addr = tagAddress(inbox.address);
  return {
    address: inbox.address || null,
    id: inbox.id || (addr.local || null),
    domain: addr.domain,
    token: inbox.token || inbox.key || null,
    accessUrl: inbox.url || inbox.accessUrl || null,
    apiUrl: inbox.apiUrl || null,
    expiresAt: inbox.expiresAt || null,
    expiresInHuman: inbox.expiresAt ? humanDur(new Date(inbox.expiresAt).getTime() - Date.now()) : null,
    ok: data.ok !== false,
    api,
  };
}

function normalizeMessage(m, inboxInfo) {
  const sender = parseSender(m.sender);
  const receivedMs = m.received_at ? Number(m.received_at) * 1000 : null;
  const att = extractAttachments(m);
  return {
    id: m.id,
    from: { raw: m.sender, name: sender.name, address: sender.address },
    to: (inboxInfo && inboxInfo.address) || m.to || null,
    subject: m.subject || null,
    receivedAt:
      receivedMs == null
        ? null
        : { unixSeconds: m.received_at, iso: new Date(receivedMs).toISOString(), human: new Date(receivedMs).toString() },
    snippet: snippet(m.text_body || listingSnippet(m.html_body)),
    textBody: m.text_body || null,
    htmlBody: m.html_body != null && m.html_body !== "" ? { available: true, lengthBytes: Buffer.byteLength(m.html_body) } : { available: false },
    attachments: att,
    links: extractLinks(m.html_body, m.text_body),
  };
}

function listingSnippet(html) {
  if (typeof html !== "string") return null;
  const t = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;/g, " ");
  return t;
}

function normalizeInboxResponse(data) {
  const inbox = data.inbox || {};
  const messages = Array.isArray(data.messages) ? data.messages : [];
  const expires = inbox.expiresAt ? new Date(inbox.expiresAt) : null;
  const expired = !inbox.permanent && expires ? expires.getTime() <= Date.now() : false;
  return {
    ok: data.ok !== false,
    inbox: {
      address: inbox.address || null,
      id: inbox.id || null,
      domain: tagAddress(inbox.address).domain,
      status: expired ? "kedaluwarsa" : "aktif",
      expiresAt: inbox.expiresAt || null,
      expiresInHuman: expires && !expired ? humanDur(expires.getTime() - Date.now()) : "0 detik",
      permanent: !!inbox.permanent,
    },
    messageCount: messages.length,
    messages: messages.map((m) => normalizeMessage(m, inbox)),
    loginLinks: Array.isArray(data.loginLinks) ? data.loginLinks : [],
    empty: messages.length === 0,
    emptyHint: messages.length === 0 ? "Belum ada pesan. Kirim email ke alamat di atas, lalu jalankan command inbox/refresh lagi." : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Sesi (menyimpan alamat + token antar pemanggilan CLI)               */
/* ------------------------------------------------------------------ */

function loadSession() {
  try {
    const raw = fs.readFileSync(SESSION_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(sess) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(sess, null, 2) + "\n");
}

function resolveKey(argv) {
  const fromFlag = (argv["key"] || argv.f || null);
  if (fromFlag) return String(fromFlag);
  const sess = loadSession();
  if (sess && sess.token) return sess.token;
  throw new Error(
    `Token inbox tidak ditemukan. Jalankan 'node scrape-jultempmail.js create' dulu, atau pakai --key TOKEN.`
  );
}

/* ------------------------------------------------------------------ */
/* Pemecah argumen CLI sederhana                                       */
/* ------------------------------------------------------------------ */

function parseArgv(args) {
  const named = { _: [] };
  for (let idx = 0; idx < args.length; idx++) {
    const token = args[idx];
    if (!token.startsWith("-")) {
      named._.push(token);
      continue;
    }
    const long = token.startsWith("--");
    const strip = token.replace(/^-+/, "").split("=");
    const name = strip[0];
    const inlineValue = strip.length > 1 ? strip.slice(1).join("=") : undefined;
    if (inlineValue !== undefined) {
      named[name] = coerce(inlineValue);
    } else if (
      typeof args[idx + 1] === "string" && args[idx + 1] !== "" && !args[idx + 1].startsWith("-")
      && (name === "name" || name === "key" || name === "poll" || name === "interval")
    ) {
      named[name] = coerce(args[++idx]); // nilai flag eksplisit berikut token
    } else {
      named[name] = true; // flag boolean (mis. --json, --yes, --worker)
    }
  }
  return named;
}

function coerce(v) {
  if (typeof v !== "string") return v;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

/* ------------------------------------------------------------------ */
/* Cetak JSON rapi ke stdout                                           */
/* ------------------------------------------------------------------ */

function out(doc) {
  process.stdout.write(JSON.stringify(doc, null, 2) + "\n");
}

function fmtCreated(res) {
  return {
    ok: res.ok,
    action: "create",
    address: res.address,
    domain: res.domain,
    messageInboxId: res.id,
    token: res.token,
    url: res.accessUrl,
    apiUrl: res.apiUrl,
    expiresAt: res.expiresAt,
    timeLeft: res.expiresInHuman,
    endpoint: res.api,
    session: { disimpan: SESSION_FILE },
  };
}

function fmtInbox(normalized, api) {
  return {
    ok: normalized.ok,
    action: "inbox",
    inbox: normalized.inbox,
    messageCount: normalized.messageCount,
    messages: normalized.messages,
    loginLinks: normalized.loginLinks,
    note: normalized.empty ? normalized.emptyHint : undefined,
    endpoint: api,
  };
}

/* ------------------------------------------------------------------ */
/* Formatter detail pesan                                              */
/* ------------------------------------------------------------------ */

function fmtMessageDetail(msg, inbox) {
  return {
    ok: true,
    action: "read",
    id: msg.id,
    from: msg.from,
    to: msg.to || (inbox && inbox.address) || null,
    subject: msg.subject,
    receivedAt: msg.receivedAt,
    snippet: msg.snippet,
    textBody: msg.textBody,
    htmlBody: msg.htmlBody,
    attachments: msg.attachments,
    links: msg.links,
    note: "Detail pesan inline di respons inbox; server tidak menyediakan endpoint /message/:id (404 Route tidak ditemukan).",
  };
}

/* ------------------------------------------------------------------ */
/* Aksi CLI                                                            */
/* ------------------------------------------------------------------ */

async function actionApi() {
  out({
    ok: true,
    action: "api-map",
    target: "https://julzaexce.my.id/tempmail",
    backendWorker: WORKER_BASE,
    apis: [
      {
        feature: "Buat alamat email sementara (acak)",
        method: "POST",
        endpoint: `${SITE_BASE}/api/tempmail/create`,
        requestParams: {},
        responseJson: '{ ok, inbox: { address, token, key, id, url, accessUrl, apiUrl, expiresAt } }',
      },
      {
        feature: "Buat alamat dengan nama khusus (5-16 huruf/angka)",
        method: "POST",
        endpoint: `${SITE_BASE}/api/tempmail/create`,
        requestParams: { body: { name: "string (opsional, 5-16 [a-z0-9], otomatis lowercased)" } },
        errorResponses: [
          '{ ok:false, error:"Nama email sudah dipakai, pilih nama lain" } (400)',
          '{ ok:false, error:"Nama email harus 5-16 karakter: huruf dan angka saja" } (400)',
        ],
        responseJson: '{ ok, inbox: { address, token, key, id, url, accessUrl, apiUrl, expiresAt } }',
      },
      {
        feature: "Muat / segarkan inbox (list pesan, detail inline)",
        method: "GET",
        endpoint: `${SITE_BASE}/api/tempmail/inbox?key=<TOKEN>`,
        requestParams: { query: { key: "token inbox" } },
        messageFields: { id: "string", sender: "string", subject: "string", received_at: "unix epoch detik", text_body: "string", html_body: "string" },
        responseJson: '{ ok, inbox: { address, id, expiresAt, permanent }, messages: [...], loginLinks: [...] }',
        note: "Tidak ada pagination dan tidak ada endpoint detail /message/:id.",
      },
      {
        feature: "Hapus alamat/inbox",
        method: "DELETE",
        endpoint: `${WORKER_BASE}/api/inbox`,
        requestParams: { headers: { Authorization: "Bearer <TOKEN>" } },
        responseJson: "{ ok: true }",
        note: "Hanya tersedia di backend worker (proxy situs tidak punya route DELETE: 404 Route tidak ditemukan). Sama seperti kode frontend.",
      },
      {
        feature: "Buat inbox (jalur backend langsung, alternatif)",
        method: "POST",
        endpoint: `${WORKER_BASE}/api/inbox`,
        requestParams: { body: { name: "string (opsional)" } },
        responseJson: '{ ok, inbox: { ... sama seperti create di proxy situs } }',
      },
      {
        feature: "Baca pesan masuk / detail email",
        method: "GET",
        endpoint: `${SITE_BASE}/api/tempmail/inbox?key=<TOKEN>`,
        requestParams: { query: { key: "token inbox" } },
        responseJson: "detail email inline di field messages: text_body, html_body, dsb",
      },
    ],
    conventions: {
      httpErrorShape: '{ ok:false, error:"<pesan>" }',
      notFound404: '{ ok:false, error:"Inbox tidak ditemukan atau sudah kedaluwarsa" }',
      route404: '{ ok:false, error:"Route tidak ditemukan" }',
      clientBehaviour: "timeout 15 dtk; GET diulang 2x jeda 500ms; UI auto-refresh 12 dtk; masa aktif 7 hari",
    },
  });
}

async function actionCreate(argv) {
  const name = argv.name || null;
  const res = await createInbox(name);
  const doc = fmtCreated(res);
  saveSession({
    address: res.address,
    token: res.token,
    key: res.token,
    id: res.id,
    domain: res.domain,
    url: res.accessUrl,
    expiresAt: res.expiresAt,
    savedAt: nowISO(),
  });
  doc.savedTo = SESSION_FILE;
  out(doc);
  return doc;
}

async function actionInbox(argv) {
  const key = resolveKey(argv);
  let wantsPoll = Number(argv.poll || process.env.JULZ_POLL || 0);
  let interval = Math.max(2, Number(argv.interval || process.env.JULZ_INTERVAL || 5));
  const { raw: data, api } = await getInbox(key);
  let normalized = normalizeInboxResponse(data);
  const doc = fmtInbox(normalized, api);
  if (wantsPoll > 0 && Array.isArray(normalized.messages) && normalized.messages.length === 0) {
    for (let i = 1; i <= wantsPoll; i++) {
      await sleep(interval * 1000);
      const d2 = (await getInbox(key)).raw;
      normalized = normalizeInboxResponse(d2);
      if (normalized.messages.length > 0) break;
    }
    const doc2 = fmtInbox(normalized, api);
    doc2.action = "inbox";
    doc2.polled = { times: wantsPoll, intervalSec: interval };
    out(doc2);
    return doc2;
  }
  out(doc);
  return doc;
}

async function actionRead(argv) {
  const msgId = argv._[1];
  if (!msgId) throw new Error("Pemakaian: read <id-pesan>");
  const key = resolveKey(argv);
  const { raw } = await getInbox(key);
  const norm = normalizeInboxResponse(raw);
  const found = norm.messages.find((m) => String(m.id) === String(msgId));
  if (!found) {
    throw new Error(
      `Pesan dengan id '${msgId}' tidak ada di inbox (${norm.messageCount} pesan tersedia). Gunakan command 'inbox' untuk melihat daftar id.`
    );
  }
  const doc = fmtMessageDetail(found, norm.inbox);
  out(doc);
  return doc;
}

async function actionDelete(argv) {
  const key = resolveKey(argv);
  const res = await deleteInbox(key);
  try {
    const sess = loadSession();
    if (sess && (sess.token === key || sess.key === key)) {
      fs.unlinkSync(SESSION_FILE);
      res.clearedSession = true;
    }
  } catch {
    /* abaikan */
  }
  out({
    ok: true,
    action: "delete",
    deleted: true,
    endpoint: res.api,
    verification: res.proof,
    response: res.delete,
    note:
      "DELETE dilakukan ke backend worker langsung (proxy situs tidak mendukung route DELETE).",
  });
  return res;
}

async function actionStatus(argv) {
  const sess = loadSession();
  if (!sess) {
    out({ ok: false, action: "status", message: "Belum ada sesi. Jalankan 'create' dulu." });
    return;
  }
  let live = null;
  try {
    const { raw } = await getInbox(sess.token);
    const n = normalizeInboxResponse(raw);
    live = { status: n.inbox.status, online: n.ok && n.inbox.status === "aktif", messageCount: n.messageCount, expiresAt: n.inbox.expiresAt, expiresInHuman: n.inbox.expiresInHuman };
  } catch (e) {
    live = {
      status: "kedaluwarsa / tidak ditemukan",
      online: false,
      detail: e.message,
    };
  }
  out({ ok: true, action: "status", session: sess, live });
}

async function actionFull(argv) {
  const created = (await actionCreate(argv));
  const key = created.token;
  await sleep(500);
  try {
    const { raw, api } = await getInbox(key);
    const norm = normalizeInboxResponse(raw);
    let setUpdok = norm;
    const wantsPoll = Number(argv.poll || 2);
    if (wantsPoll > 0) {
      for (let i = 1; i <= wantsPoll; i++) {
        await sleep(Math.max(3, Number(argv.interval || 5)) * 1000);
        const d2 = (await getInbox(key)).raw;
        setUpdok = normalizeInboxResponse(d2);
        if (setUpdok.messages.length > 0) break;
      }
    }
    const doc = {
      ok: true,
      action: "full",
      address: created.address,
      domain: created.domain,
      token: key,
      url: created.accessUrl,
      expiresAt: created.expiresAt,
      timeLeft: created.expiresInHuman,
      inbox: {
        status: setUpdok.inbox.status,
        messageCount: setUpdok.messageCount,
        messages: setUpdok.messages,
      },
      loginLinks: setUpdok.loginLinks,
      endpointCreate: created.api,
      endpointInbox: api,
    };
    if (argv["delete-inbox"]) {
      const res = await deleteInbox(key);
      await actionDelete({ key });
      doc.deleted = true;
      doc.deleteVerification = res.proof;
    } else {
      doc.deleted = false;
    }
    out(doc);
    return doc;
  } catch (e) {
    // inbox gagal diambil; tetap keluarkan hasil create
    out({
      ok: true,
      action: "full",
      inbox: {
        status: "gagal memuat",
        detail: e.status ? `HTTP ${e.status}` : e.message,
      },
      inboxOut: null,
      address: created.address,
      token: created.token,
      expiresAt: created.expiresAt,
      note: "Sesi tetap tersimpan; coba jalankan 'inbox' nanti.",
    });
  }
}

/* ------------------------------------------------------------------ */
/* Router CLI                                                          */
/* ------------------------------------------------------------------ */

async function main() {
  const raw = process.argv.slice(2);
  const argv = parseArgv(raw);
  const scriptName = path.basename(process.argv[1] || "scrape-jultempmail.js");
  const cmd = argv._[0] || "help";
  try {
    switch (cmd) {
      case "api":
      case "endpoint":
        await actionApi();
        break;
      case "create":
        await actionCreate(argv);
        break;
      case "inbox":
      case "refresh":
        await actionInbox(argv);
        break;
      case "read":
        await actionRead(argv);
        break;
      case "delete":
        await actionDelete(argv);
        break;
      case "status":
        await actionStatus(argv);
        break;
      case "full":
        await actionFull(argv);
        break;
      case "help":
      default:
        out({
          ok: true,
          action: "help",
          usage: [
            "node scrape-jultempmail.js api",
            "node scrape-jultempmail.js create [--name nama123]",
            "node scrape-jultempmail.js inbox [--key TOKEN] [--poll 5] [--interval 5] [--worker]",
            "node scrape-jultempmail.js read <id-pesan> [--key TOKEN]",
            "node scrape-jultempmail.js delete [--key TOKEN]",
            "node scrape-jultempmail.js status",
            "node scrape-jultempmail.js full [--name nama123] [--poll 3] [--delete-inbox]",
          ],
          notes:
            "Output selalu JSON. Sesi (alamat+token) disimpan di jul-tempmail-session.json.",
        });
        break;
    }
  } catch (e) {
    out({
      ok: false,
      action: cmd,
      error: e && e.message ? e.message : String(e),
      status: e && e.status ? e.status : undefined,
    });
    process.exit(1);
  }
}

main();