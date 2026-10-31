#!/usr/bin/env node

/**
 * Name : Github Stalk
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web : https://github.com
 * Type : Scraper
 * Description : Intinya stalk akun github
Note : error fix sendiri
 */

const { spawnSync } = require('child_process');

function loadLib(name) {
  try {
    return require(name);
  } catch (e) {
    if (!String((e && e.message) || '').includes('MODULE_NOT_FOUND')) throw e;
    process.stderr.write(`[setup] dependensi "${name}" belum terpasang, menjalankan npm install otomatis...\n`);
    const r = spawnSync('npm', ['install', name, '--no-audit', '--no-fund', '--loglevel=error'], {
      cwd: __dirname,
      stdio: 'inherit',
    });
    if (r.status !== 0) {
      process.stderr.write('[setup] install otomatis gagal. Jalankan manual: npm install axios cheerio\n');
      process.exit(1);
    }
    return require(name);
  }
}

const axios = loadLib('axios');
const cheerio = loadLib('cheerio');

const GH = 'https://github.com';
const API = 'https://api.github.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const maxAttempts = () => Math.max(0, Number(process.env.GS_MAX_ATTEMPTS || 0));
const baseDelay = () => Math.max(500, Number(process.env.GS_DELAY_MS || 3000));
const MAX_DELAY = 60000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (s) => process.stderr.write(`${s}\n`);

class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

async function httpGet(url, { headers = {}, timeoutMs = 25000, finalStatuses = [200, 404] } = {}) {
  let delay = baseDelay();
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await axios.get(url, {
        headers: {
          'user-agent': UA,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          ...headers,
        },
        timeout: timeoutMs,
        maxRedirects: 5,
        validateStatus: () => true,
      });
      if (res.status === 404 || res.status === 410) {
        throw new NotFoundError(`HTTP ${res.status} pada ${url}`);
      }
      if (finalStatuses.includes(res.status)) return res;
      log(`[http] percobaan ${attempt}: ${url} memberi status HTTP ${res.status} (belum 200)`);
    } catch (err) {
      if (err && err.name === 'NotFoundError') throw err;
      const code = err && err.code ? err.code : (err && err.message) || 'request-error';
      log(`[http] percobaan ${attempt}: ${url} gagal -> ${code}`);
    }
    const cap = maxAttempts();
    if (cap > 0 && attempt >= cap) {
      throw new Error(`gagal setelah ${attempt} percobaan (GS_MAX_ATTEMPTS) pada ${url}`);
    }
    log(`[http] menunggu ${delay}ms lalu mencoba lagi sampai status 200...`);
    await sleep(delay);
    delay = Math.min(delay * 2, MAX_DELAY);
  }
}

function parseCount(raw) {
  if (raw == null) return { value: 0, approx: false };
  const s = String(raw).replace(/\u00a0/g, ' ').trim().toLowerCase().replace(/,/g, '');
  const m = s.match(/^([\d.]+)\s?([km])$/);
  if (m) {
    const n = Number(m[1]);
    if (!Number.isNaN(n)) {
      return { value: Math.round(n * (m[2] === 'm' ? 1e6 : 1e3)), approx: true };
    }
  }
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return { value: Number.isNaN(n) ? 0 : n, approx: false };
}

function clean(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function parseProfileHTML(html) {
  const $ = cheerio.load(html);
  const textOf = (sel) => {
    const el = $(sel).first();
    return el.length ? clean(el.text()) : '';
  };
  const data = {
    username: textOf('.vcard-username'),
    name: textOf('.vcard-fullname'),
    company: '',
    location: '',
    public_repos: 0,
    followers: 0,
    following: 0,
    bio: '',
    _approx: false,
  };

  const bioEl = $('.user-profile-bio').first();
  if (bioEl.length) {
    data.bio = clean(bioEl.attr('data-bio-text') || bioEl.text());
  }

  let li = $('li[itemprop="worksFor"] .p-org').first();
  if (!li.length) li = $('li.vcard-detail .octicon-organization').first().closest('li');
  if (li.length) data.company = clean(li.text());

  li = $('li[itemprop="homeLocation"]').first();
  if (!li.length) li = $('li.vcard-detail .octicon-location').first().closest('li');
  if (li.length) data.location = clean(li.text());

  const followers = parseCount($('a[href*="tab=followers"] .text-bold').first().text());
  const following = parseCount($('a[href*="tab=following"] .text-bold').first().text());
  data.followers = followers.value;
  data.following = following.value;
  data._approx = followers.approx || following.approx;

  let counter = $('a[data-hydro-click*="TAB_REPOSITORIES"] .Counter').first();
  if (!counter.length) {
    counter = $('a.UnderlineNav-item')
      .filter((i, el) => /repositories/i.test($(el).text()))
      .first()
      .find('.Counter')
      .first();
  }
  if (counter.length) {
    const repos = parseCount(counter.attr('title') || counter.text());
    data.public_repos = repos.value;
    data._approx = data._approx || repos.approx;
  }

  return data;
}

async function scrapeHTMLProfile(login) {
  const res = await httpGet(`${GH}/${encodeURIComponent(login)}`);
  const data = parseProfileHTML(String((res && res.data) || ''));
  if (!data.username) {
    throw new NotFoundError(`halaman profil '${login}' tidak memiliki data pengguna (bukan user).`);
  }
  return data;
}

async function apiProfile(login) {
  const apiHeaders = { accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  let res = await httpGet(`${API}/users/${encodeURIComponent(login)}`, { headers: apiHeaders });
  let d = res && res.status === 200 ? res.data : null;
  if (!d) {
    log('[fallback] HTML profil gagal, mencoba GitHub REST API (tetap axios, tanpa engine berat)...');
    res = await httpGet(`${API}/orgs/${encodeURIComponent(login)}`, { headers: apiHeaders });
    d = res && res.status === 200 ? res.data : null;
  }
  if (!d || !d.login) {
    throw new NotFoundError(`akun '${login}' tidak ditemukan di GitHub.`);
  }
  return {
    username: String(d.login || ''),
    name: clean(d.name),
    company: clean(d.company),
    location: clean(d.location),
    public_repos: Number(d.public_repos) || 0,
    followers: Number(d.followers) || 0,
    following: Number(d.following) || 0,
    bio: clean(d.bio != null ? d.bio : d.description),
    _approx: false,
  };
}

async function searchUser(q) {
  const res = await httpGet(
    `${API}/search/users?q=${encodeURIComponent(q)}&per_page=1`,
    { headers: { accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, finalStatuses: [200, 404, 422] }
  );
  const status = res && res.status;
  if (status === 404 || status === 422) return null;
  const items = (res && res.data && res.data.items) || [];
  return items.length ? String(items[0].login) : null;
}

function normalizeQuery(raw) {
  let s = String(raw || '').trim();
  if (/^https?:\/\//i.test(s)) {
    if (!/github\.com/i.test(s)) log('[warn] URL bukan github.com, tetap mencoba dari URL tersebut.');
    let path = s.replace(/^https?:\/\/[^/]+/i, '');
    path = path.replace(/^\/+/, '').split(/[?#]/)[0];
    const seg = path.split('/').filter(Boolean).shift() || '';
    s = decodeURIComponent(seg);
  }
  s = s.replace(/^@/, '').trim();
  const isLogin = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(s) && s.length <= 39;
  return { login: isLogin ? s : '', search: s, raw: s };
}

async function fail(message, query) {
  const out = {
    status: 'error',
    success: false,
    message,
    query: query || '',
  };
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  process.exit(1);
}

async function stalk(raw) {
  const q = normalizeQuery(raw);
  let data = null;
  let reason = '';

  if (q.login) {
    try {
      data = await scrapeHTMLProfile(q.login);
    } catch (e) {
      if (!(e instanceof NotFoundError)) throw e;
      reason = e.message;
      log(`[stalk] '${q.login}' tidak muncul (404/bukan user), mencari lewat pencarian GitHub...`);
    }
  }

  if (!data) {
    const qstr = q.login || q.search;
    try {
      const hit = await searchUser(qstr);
      if (hit) {
        if (!q.login || hit.toLowerCase() !== q.login.toLowerCase()) {
          try {
            data = await scrapeHTMLProfile(hit);
          } catch (e) {
            reason = e.message;
          }
        }
        if (!data) {
          try {
            data = await apiProfile(hit);
          } catch (e) {
            reason = e.message;
          }
        }
      }
    } catch (e) {
      reason = reason || e.message;
    }
  }

  if (!data && q.login) {
    try {
      data = await apiProfile(q.login);
    } catch (e) {
      if (!(e instanceof NotFoundError)) throw e;
      reason = e.message;
    }
  }

  if (data && data._approx) {
    try {
      const exact = await apiProfile(data.username);
      data.public_repos = exact.public_repos;
      data.followers = exact.followers;
      data.following = exact.following;
      data._approx = false;
    } catch (e) {
      log(`[stalk] angka perkiraan dipakai (API tidak bisa mengoreksi): ${e.message}`);
    }
  }

  if (!data) {
    reason = reason || `akun '${raw}' tidak ditemukan / tidak sesuai di GitHub`;
    await fail(`gagal: ${reason}`, raw);
  }

  const result = {
    status: 'success',
    success: true,
    message: `GitHub stalk berhasil: data profil '${data.username}' diambil`,
    query: raw,
    source: `${GH}/${data.username}`,
    scraped_at: new Date().toISOString(),
    data: {
      username: data.username,
      name: data.name,
      company: data.company,
      location: data.location,
      public_repos: Number(data.public_repos) || 0,
      followers: Number(data.followers) || 0,
      following: Number(data.following) || 0,
      bio: data.bio || '',
    },
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(0);
}

async function main() {
  const args = process.argv.slice(2).map(String);
  const raw = args.join(' ').trim();
  if (!raw) {
    await fail(
      'gagal: query kosong. Penggunaan: node scrape-githubstalk.js <username | nama | url-profil> (contoh: node scrape-githubstalk.js XZEERH)'
    );
  }
  try {
    await stalk(raw);
  } catch (e) {
    await fail(`gagal: ${(e && e.message) || 'request error'}`, raw);
  }
}

if (require.main === module) {
  main();
}

module.exports = { httpGet, scrapeHTMLProfile, apiProfile, searchUser, normalizeQuery, parseProfileHTML, parseCount };
