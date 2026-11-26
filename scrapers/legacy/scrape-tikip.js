#!/usr/bin/env node
'use strict';

/**
 * Name : tikip us (intip data akun tiktok lewat @username)
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Type : Scraper
 * Description : Tikip.us adalah website untuk mencari dan menganalisis informasi akun TikTok berdasarkan username, seperti User ID, nickname, followers, following, total likes, jumlah video, perkiraan wilayah akun, tanggal pembuatan akun, serta statistik engagement jika tersedia.
 * Note: sebagian ISP menyadap kunci DNS untuk domain .workers.dev (mis. mengarah ke blockpage ISP). Script ini otomatis melakukan resolve lewat DNS-over-HTTPS (DoH) lalu menyambung ke IP asli, sehingga tetap bisa jalan. Bila DoH gagal, otomatis fallback ke DNS sistem. Btw error fix sendiri.
 */

const dns = require('dns');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ENDPOINT_HOST = 'shinyfrydgdghfdgdgmouse-a6de.issam1996kech.workers.dev';
const ENDPOINT_PATH = '/api/v1/profile';
const ENDPOINT_URL = `https://${ENDPOINT_HOST}${ENDPOINT_PATH}`;
const SOURCE = 'https://tikip.us';

const DOH_PROVIDERS = [
  'https://cloudflare-dns.com/dns-query',
  'https://1.1.1.1/dns-query',
  'https://dns.google/resolve',
];

const DEFAULT_TIMEOUT = 90000; // halaman asli memakai 90s
const MAX_RETRY = 4;

// ---------------------------------------------------------------
// Argumen CLI
// ---------------------------------------------------------------
function parseArgs(argv) {
  const opts = {
    usernames: [],
    out: null,
    raw: false,
    compact: false,
    timeout: DEFAULT_TIMEOUT,
    noDoh: false,
    help: false,
  };
  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') opts.help = true;
    else if (arg === '--raw') opts.raw = true;
    else if (arg === '--compact') opts.compact = true;
    else if (arg === '--no-doh') opts.noDoh = true;
    else if (arg.startsWith('--out=')) opts.out = arg.slice('--out='.length);
    else if (arg.startsWith('-o=')) opts.out = arg.slice('-o='.length);
    else if (arg.startsWith('--timeout=')) {
      const t = parseInt(arg.slice('--timeout='.length), 10);
      if (Number.isFinite(t) && t > 0) opts.timeout = t;
    } else if (!arg.startsWith('-')) {
      arg.split(/[\s,]+/).filter(Boolean).forEach((u) => opts.usernames.push(u));
    }
  }
  return opts;
}

function printHelp() {
  console.log(`scrape-tikip.js - Scraper profil TikTok via Tikip.us

Penggunaan:
  node scrape-tikip.js "@username"
  node scrape-tikip.js username1 username2
  node scrape-tikip.js "@username" --out=hasil.json
  node scrape-tikip.js "@username" --raw --compact

Opsi:
  --out=FILE     Simpan hasil ke file (selain dicetak ke stdout)
  --raw          Sertakan respons mentah dari API
  --compact      Cetak JSON tanpa indentasi
  --timeout=MS   Timeout request per percobaan (default 90000)
  --no-doh       Jangan pakai DNS-over-HTTPS (pakai DNS sistem)
  -h, --help     Tampilkan bantuan`);
}

// ---------------------------------------------------------------
// Normalisasi username
// ---------------------------------------------------------------
function normalizeUsername(input) {
  if (!input) return '';
  let u = String(input).trim();
  // Dukung input URL penuh / @username / username
  const m = u.match(/(?:tiktok\.com\/+@?|@)([A-Za-z0-9._]+)/i);
  if (m) u = m[1];
  return u.replace(/^@+/, '').replace(/[\/?#].*$/, '').trim();
}

// ---------------------------------------------------------------
// DNS-over-HTTPS resolve (bypass DNS hijack)
// ---------------------------------------------------------------
async function resolveViaDoH(hostname, timeout) {
  const errors = [];
  for (const base of DOH_PROVIDERS) {
    try {
      const url = `${base}${base.includes('?') ? '&' : '?'}name=${encodeURIComponent(hostname)}&type=A`;
      const res = await axios.get(url, {
        timeout: Math.min(timeout, 15000),
        headers: { accept: 'application/dns-json' },
        // DoH diakses lewat IP/host-nya sendiri; biarkan DNS sistem untuk ini.
      });
      const answers = Array.isArray(res.data && res.data.Answer) ? res.data.Answer : [];
      const a = answers.filter((x) => x && x.type === 1 && x.data).map((x) => x.data);
      if (a.length) return { ip: a[0], all: a, provider: base };
    } catch (e) {
      errors.push(`${base}: ${e.code || e.message}`);
    }
  }
  return { ip: null, all: [], errors };
}

// Lookup kustom utk net/http: selalu mengembalikan IP hasil DoH.
function makeLookup(ip) {
  return function lookup(hostname, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (ip && (!options.family || options.family === 4)) {
      if (options.all) return callback(null, [{ address: ip, family: 4 }]);
      return callback(null, ip, 4);
    }
    return dns.lookup(hostname, options, callback);
  };
}

function makeAgents(ip) {
  if (!ip) return {};
  const opts = { lookup: makeLookup(ip) };
  return {
    httpsAgent: new https.Agent(opts),
    httpAgent: new http.Agent(opts),
  };
}

// ---------------------------------------------------------------
// Request ke endpoint dengan retry + rate-limit handling
// ---------------------------------------------------------------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractWaitSeconds(msg) {
  if (!msg) return null;
  const m = String(msg).match(/(\d+)\s*second/i);
  return m ? parseInt(m[1], 10) : null;
}

async function fetchProfile(username, opts, agents) {
  let lastErr = null;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const res = await axios.get(ENDPOINT_URL, {
        params: { username },
        timeout: opts.timeout,
        headers: {
          accept: 'application/json',
          'user-agent':
            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
          origin: SOURCE,
          referer: SOURCE + '/',
        },
        ...agents,
      });

      const body = res.data;
      if (body && body.status === 'error') {
        const wait = extractWaitSeconds(body.error || body.message);
        if (wait != null && attempt < MAX_RETRY) {
          process.stderr.write(`  rate limited, menunggu ${wait}s (percobaan ${attempt}/${MAX_RETRY})...\n`);
          await sleep((wait + 1) * 1000);
          continue;
        }
        throw new Error(body.error || body.message || 'API mengembalikan status error');
      }
      return body;
    } catch (err) {
      lastErr = err;

      // Rate limit dari HTTP 429
      const status = err.response && err.response.status;
      if (status === 429) {
        const msg =
          (err.response.data && (err.response.data.error || err.response.data.message)) ||
          err.message;
        const wait = extractWaitSeconds(msg);
        if (attempt < MAX_RETRY) {
          const delay = (wait != null ? wait + 1 : 30) * 1000;
          process.stderr.write(`  HTTP 429, menunggu ${Math.round(delay / 1000)}s (percobaan ${attempt}/${MAX_RETRY})...\n`);
          await sleep(delay);
          continue;
        }
      }

      // Error jaringan / timeout -> retry singkat (kecuali percobaan terakhir)
      const retriable =
        !err.response ||
        (status >= 500 && status < 600) ||
        ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'EAI_AGAIN'].includes(err.code);

      if (retriable && attempt < MAX_RETRY) {
        const delay = Math.min(2000 * attempt, 8000);
        process.stderr.write(`  ${err.code || err.message}, retry dalam ${delay}ms (${attempt}/${MAX_RETRY})...\n`);
        await sleep(delay);
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------
// Format tanggal (meniru formatUtcDate di halaman)
// ---------------------------------------------------------------
function toDateInfo(val) {
  if (val == null || val === 0 || val === '0' || val === '' || val === false) {
    return { unix: null, iso: null, display: 'Never', available: false };
  }
  let t = Number(val);
  if (Number.isFinite(t) && t > 0) {
    if (t < 1e10) t *= 1000; // detik -> ms
    const d = new Date(t);
    if (!isNaN(d.getTime())) {
      return {
        unix: Math.floor(t / 1000),
        iso: d.toISOString(),
        display: d.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'UTC',
        }) + ' UTC',
        available: true,
      };
    }
  }
  const d2 = new Date(val);
  if (!isNaN(d2.getTime())) {
    return {
      unix: Math.floor(d2.getTime() / 1000),
      iso: d2.toISOString(),
      display: d2.toUTCString(),
      available: true,
    };
  }
  return { unix: null, iso: null, display: 'Never', available: false };
}

function cleanRegion(code, name) {
  const c = code && String(code).trim();
  const n = name && String(name).trim();
  if (!c && !n) return { code: null, name: null, available: false };
  return { code: c || null, name: n || c || null, available: true };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------
// Bangun output JSON rapi
// ---------------------------------------------------------------
function buildOutput(username, body) {
  const data = (body && body.data) || {};
  const user = data.user || {};
  const stats = data.stats || {};

  // Ambil nilai dengan fallback ke field datar (rawData.*)
  const pick = (v, fallback) => (v != null && v !== '' ? v : fallback);

  const handleRaw = pick(user.uniqueId, data.username) || username;
  const handle = '@' + String(handleRaw).replace(/^@+/, '');

  const followers = num(pick(stats.followerCount, data.followers));
  const following = num(pick(stats.followingCount, data.following));
  const friends = num(pick(stats.friendCount, data.friends));
  const hearts = num(pick(stats.heartCount, pick(stats.heart, data.hearts)));
  const videos = num(pick(stats.videoCount, data.videos));

  // Wilayah
  const registeredRegion = cleanRegion(
    pick(data.registered_region, pick(data.locked_region, pick(user.registered_region, user.locked_region))),
    pick(data.registered_region_name, pick(data.locked_region_name, user.registered_region_name))
  );
  const currentRegion = cleanRegion(
    pick(data.current_region, user.current_region),
    pick(data.current_region_name, user.current_region_name)
  );

  // Tanggal
  const createdAt = toDateInfo(pick(user.createTime, data.created_at));
  const nicknameModifiedAt = toDateInfo(
    pick(user.nickNameModifyTime, pick(data.nick_name_modify_time, pick(data.nickname_modify_time, data.nickname_modified)))
  );
  const usernameModifiedAt = toDateInfo(
    pick(user.uniqueIdModifyTime, pick(data.unique_id_modify_time, pick(data.username_modify_time, data.username_modified)))
  );

  // Metrik turunan (mengikuti rumus di halaman Tikip)
  const avgLikesPerFollower = followers > 0 && hearts > 0 ? +(hearts / followers).toFixed(2) : 0;
  const avgLikesPerVideo = videos > 0 && hearts > 0 ? +(hearts / videos).toFixed(2) : 0;
  let engagementRate = 0;
  let engagementRateFormatted = '0.00%';
  if (followers > 0 && hearts > 0 && videos > 0) {
    engagementRate = ((hearts / videos) / followers) * 100;
    engagementRateFormatted = engagementRate < 0.01 ? '< 0.01%' : engagementRate.toFixed(2) + '%';
  }

  const dataAvailable = [followers, following, hearts, videos].some((v) => v > 0);
  const status =
    !data || Object.keys(data).length === 0
      ? 'no_data'
      : dataAvailable || user.uniqueId
      ? 'success'
      : 'partial';

  const warnings = (body && body.warnings) || [];

  return {
    source: SOURCE,
    method: 'api-endpoint (SPA -> JSON API)',
    endpoint: ENDPOINT_URL,
    searchedUsername: handle,
    fetchedAt: new Date().toISOString(),
    status,
    dataAvailability: {
      profile: !!(user.uniqueId || data.username),
      registeredRegion: registeredRegion.available,
      currentRegion: currentRegion.available,
      creationDate: createdAt.available,
      language: !!pick(user.language, data.language),
      followers: followers > 0,
      following: following > 0,
      friends: friends > 0,
      hearts: hearts > 0,
      videos: videos > 0,
      nicknameModifyTime: nicknameModifiedAt.available,
      usernameModifyTime: usernameModifiedAt.available,
    },
    profile: {
      username: handle,
      nickname: pick(user.nickname, data.nickname) || null,
      userId: String(pick(user.id, data.user_id) || '') || null,
      secUid: pick(user.secUid, data.sec_uid) || null,
      verified: !!(user.verified || data.verified),
      privateAccount: !!(user.privateAccount != null ? user.privateAccount : data.private),
      bio: pick(user.signature, data.bio) || null,
      bioLink: (user.bioLink && user.bioLink.link) || data.bio_link || null,
      language: (pick(user.language, data.language) || '').toString().toLowerCase() || null,
      region: {
        estimatedRegisteredRegion: registeredRegion.available
          ? registeredRegion
          : { code: null, name: null, available: false },
        estimatedCurrentRegion: currentRegion.available
          ? currentRegion
          : { code: null, name: null, available: false },
      },
      createdAt,
      nicknameModifiedAt,
      usernameModifiedAt,
    },
    stats: {
      followers,
      following,
      friends,
      hearts,
      videos,
    },
    derived: {
      avgLikesPerFollower,
      avgLikesPerVideo,
      engagementRate: +engagementRate.toFixed(4),
      engagementRateFormatted,
    },
    warnings,
  };
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || opts.usernames.length === 0) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  // 1) Resolve endpoint lewat DoH (bypass DNS hijack), fallback ke DNS sistem.
  let agents = {};
  if (!opts.noDoh) {
    process.stderr.write(`[dns] resolve ${ENDPOINT_HOST} via DoH...\n`);
    const r = await resolveViaDoH(ENDPOINT_HOST, opts.timeout);
    if (r.ip) {
      process.stderr.write(`[dns] -> ${r.ip} (${r.provider})\n`);
      agents = makeAgents(r.ip);
    } else {
      process.stderr.write(`[dns] DoH gagal, memakai DNS sistem.\n`);
    }
  }

  const results = [];
  const doRaw = opts.raw;

  for (let i = 0; i < opts.usernames.length; i++) {
    const username = normalizeUsername(opts.usernames[i]);
    if (!username) continue;
    process.stderr.write(`[${i + 1}/${opts.usernames.length}] lookup @${username}...\n`);

    try {
      const body = await fetchProfile(username, opts, agents);
      const out = buildOutput(username, body);
      if (doRaw) out.raw = body;
      results.push(out);
    } catch (err) {
      const status = err.response && err.response.status;
      const body = (err.response && err.response.data) || null;
      const apiCode = body && body.code ? body.code : null;
      const apiMsg =
        body && (body.error || body.message)
          ? body.error || body.message
          : err.code === 'ECONNABORTED'
          ? 'Request timeout. Coba lagi.'
          : err.message || String(err);
      results.push({
        source: SOURCE,
        endpoint: ENDPOINT_URL,
        searchedUsername: '@' + username,
        fetchedAt: new Date().toISOString(),
        status: 'error',
        errorCode: apiCode,
        error: apiMsg,
        httpStatus: status || null,
      });
    }
  }

  const single = results.length === 1;
  const output = single ? results[0] : { count: results.length, results };
  const json = JSON.stringify(output, null, opts.compact ? 0 : 2);

  console.log(json);

  if (opts.out) {
    const outPath = path.resolve(process.cwd(), opts.out);
    fs.writeFileSync(outPath, json + '\n', 'utf8');
    process.stderr.write(`[out] hasil disimpan ke ${outPath}\n`);
  }

  // exit code non-zero jika semua gagal
  const allFailed = results.every((r) => r.status === 'error');
  process.exit(allFailed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err && err.stack ? err.stack : err);
  process.exit(1);
});