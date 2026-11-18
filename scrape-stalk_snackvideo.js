#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.snackvideo.com';
const PROFILE_ENDPOINT = '/rest/o/w/pwa/profile';
const SEARCH_ENDPOINT = '/rest/o/w/pwa/v2/search/word/outer';
const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const DEFAULTS = {
  limit: 10,
  pages: 2,
  timeout: 15000,
  retries: 2,
  concurrency: 4,
  rawCounts: false,
  type: 'auto',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeOptions(options = {}) {
  return {
    type: options.type || DEFAULTS.type,
    limit: clampInt(options.limit, DEFAULTS.limit, 1, 50),
    pages: clampInt(options.pages, DEFAULTS.pages, 1, 10),
    timeout: clampInt(options.timeout, DEFAULTS.timeout, 1000, 60000),
    retries: clampInt(options.retries, DEFAULTS.retries, 0, 5),
    concurrency: clampInt(options.concurrency, DEFAULTS.concurrency, 1, 10),
    rawCounts: Boolean(options.rawCounts),
  };
}

function safeJson(data) {
  if (data === null || data === undefined) return null;
  if (typeof data === 'object') return data;
  if (typeof data !== 'string') return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getFinalUrl(response) {
  return (
    response?.request?.res?.responseUrl ||
    response?.request?._redirectable?._currentUrl ||
    response?.config?.url ||
    null
  );
}

function extractUsernameFromUrl(value) {
  const text = String(value || '').trim();
  let match = text.match(/\/@([^/?#&]+)/);
  if (match) return safeDecode(match[1]);

  match = text.match(/[?&](?:kwai_id|username|userId)=([^&#]+)/i);
  if (match) return safeDecode(match[1]);

  return null;
}

function accountUrl(kwaiId) {
  if (!kwaiId) return null;
  return `${BASE_URL}/@${encodeURIComponent(kwaiId)}`;
}

function pickCount(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

/**
 * 12385 -> "12,4K", 166928060 -> "166,9M", 148 -> 148.
 * Set rawCounts=true in module options to keep numbers.
 */
function formatCount(value, rawCounts = false) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (rawCounts || n < 1000) return n;

  const units = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];

  let unitIndex = units.findIndex(([divisor]) => n >= divisor);
  if (unitIndex < 0) return n;

  let scaled = n / units[unitIndex][0];
  if (scaled >= 999.95 && unitIndex > 0) {
    unitIndex -= 1;
    scaled = n / units[unitIndex][0];
  }

  const text = scaled
    .toFixed(1)
    .replace(/\.0$/, '')
    .replace('.', ',');
  return `${text}${units[unitIndex][1]}`;
}

function mapGender(value) {
  const code = String(value || '').toUpperCase();
  if (code === 'M') return 'Laki-laki';
  if (code === 'F') return 'Perempuan';
  return null;
}

function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function profileResult(body, searchType, options) {
  const userProfile = body?.userProfile;
  const profile = userProfile?.profile;
  if (!profile) return null;

  const counts = userProfile.ownerCount || {};
  const kwaiId = cleanText(profile.kwai_id) || null;
  const userId = profile.user_id ?? userProfile.user_id ?? null;
  const followers = pickCount(counts.fan, counts.follower, counts.followers);
  const following = pickCount(counts.follow, counts.following);
  const likes = pickCount(counts.liked, counts.like);
  const posts = pickCount(counts.photo_public, counts.photo);

  return {
    status: 'success',
    search_type: searchType,
    nickname: cleanText(profile.user_name) || null,
    username: kwaiId ? `@${kwaiId}` : null,
    user_id: userId,
    bio: cleanText(profile.userText ?? profile.user_text),
    followers: formatCount(followers, options.rawCounts),
    following: formatCount(following, options.rawCounts),
    like_count: formatCount(likes, options.rawCounts),
    gender: mapGender(profile.user_sex),
    zodiac: null,
    post_count: formatCount(posts, options.rawCounts),
    verified: profile.verified ? 'Ya' : 'Tidak',
    profile_url: accountUrl(kwaiId),
    account_url: accountUrl(kwaiId),
  };
}

function partialFromPage(pageData, searchType) {
  const kwaiId = pageData.kwaiId;
  return {
    status: 'success',
    search_type: searchType,
    nickname: pageData.nickname || kwaiId,
    username: kwaiId ? `@${kwaiId}` : null,
    user_id: null,
    bio: pageData.bio || '',
    followers: null,
    following: null,
    like_count: null,
    gender: null,
    zodiac: null,
    post_count: null,
    verified: null,
    profile_url: accountUrl(kwaiId),
    account_url: accountUrl(kwaiId),
    partial: true,
    note: 'Statistik tidak tersedia dari halaman publik; hanya data profil dasar.',
  };
}

function partialFromFeed(candidate, searchType) {
  return {
    status: 'success',
    search_type: searchType,
    nickname: cleanText(candidate.feedName) || candidate.kwaiId,
    username: `@${candidate.kwaiId}`,
    user_id: candidate.feedUserId ?? null,
    bio: cleanText(candidate.feedBio),
    followers: null,
    following: null,
    like_count: null,
    gender: mapGender(candidate.feedSex),
    zodiac: null,
    post_count: null,
    verified: null,
    profile_url: accountUrl(candidate.kwaiId),
    account_url: accountUrl(candidate.kwaiId),
    partial: true,
    note: 'Profil lengkap gagal diambil; data berasal dari feed pencarian.',
  };
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function compactText(value) {
  return normalizeText(value).replace(/\s+/g, '');
}

function nameScore(query, nickname, username) {
  const qn = normalizeText(query);
  const qc = compactText(query);
  if (!qc) return 0;

  const nn = normalizeText(nickname);
  const nc = compactText(nickname);
  const un = compactText(String(username || '').replace(/^@/, ''));

  let score = 0;
  if (nn === qn || nc === qc || un === qc) score = 100;
  else if (nc.startsWith(qc) || un.startsWith(qc)) score = 82;
  else if (nn.includes(qn) || nc.includes(qc)) score = 68;
  else if (un.includes(qc)) score = 56;
  else {
    const queryTokens = qn.split(' ').filter(Boolean);
    const nameTokens = new Set(nn.split(' ').filter(Boolean));
    const hits = queryTokens.filter((token) => nameTokens.has(token)).length;
    if (hits > 0) score = 24 + 34 * (hits / queryTokens.length);
  }

  return score;
}

function usernamePriority(query, username) {
  const qc = compactText(query);
  const un = compactText(String(username || '').replace(/^@/, ''));
  if (!qc || !un) return 0;
  if (un === qc) return 2;
  if (un.startsWith(qc)) return 1;
  return 0;
}

function buildQueryVariants(query) {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  const candidates = [
    trimmed,
    trimmed.replace(/\s+/g, '-'),
    trimmed
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ''),
  ];

  const seen = new Set();
  const variants = [];
  for (const value of candidates) {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    variants.push(value);
  }
  return variants;
}

function inferType(input, forcedType) {
  if (forcedType && forcedType !== 'auto') return forcedType;

  const text = input.trim();
  if (/^https?:\/\//i.test(text) || /(^|\.)snackvideo\.com\//i.test(text)) {
    return 'url';
  }
  if (text.startsWith('@')) return 'username';
  if (/\s/.test(text)) return 'name';
  return 'username';
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, limit), items.length);

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

class SnackVideoClient {
  constructor(options) {
    this.options = options;
    this.cookies = new Map();
    this.initPromise = null;

    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: options.timeout,
      maxRedirects: 5,
      decompress: true,
      validateStatus: () => true,
      headers: {
        'user-agent': DEFAULT_UA,
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        accept: 'application/json, text/plain, */*',
      },
    });
  }

  async init() {
    if (!this.initPromise) {
      this.initPromise = this.warmUp().catch(() => undefined);
    }
    await this.initPromise;
  }

  async warmUp() {
    const response = await this.request(
      {
        method: 'get',
        url: `${BASE_URL}/`,
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          referer: `${BASE_URL}/`,
        },
      },
      { retries: 1 },
    );
    return response.status;
  }

  storeCookies(setCookie) {
    if (!setCookie) return;
    const values = Array.isArray(setCookie) ? setCookie : [setCookie];
    for (const raw of values) {
      if (typeof raw !== 'string') continue;
      const pair = raw.split(';', 1)[0];
      const eq = pair.indexOf('=');
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name) this.cookies.set(name, value);
    }
  }

  cookieHeader() {
    if (!this.cookies.size) return '';
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  async request(config, { retries = this.options.retries } = {}) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const headers = { ...(config.headers || {}) };
        const cookie = this.cookieHeader();
        if (cookie) headers.cookie = cookie;

        const response = await this.http.request({ ...config, headers });
        this.storeCookies(response.headers?.['set-cookie']);

        if (response.status === 429 || response.status >= 500) {
          lastError = new Error(`SnackVideo membalas HTTP ${response.status}`);
          if (attempt < retries) {
            await sleep(700 * (attempt + 1));
            continue;
          }
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await sleep(700 * (attempt + 1));
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error('Permintaan ke SnackVideo gagal.');
  }

  async getProfile(kwaiId) {
    const referer = `${BASE_URL}/@${encodeURIComponent(kwaiId)}`;
    let lastError = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await this.request({
        method: 'post',
        url: PROFILE_ENDPOINT,
        data: {
          userId: kwaiId,
          deviceId: '',
          fromPhoto: false,
        },
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/json',
          origin: BASE_URL,
          referer,
        },
      });

      if (response.status !== 200) {
        lastError = new Error(`Gagal mengambil profil (HTTP ${response.status}).`);
      } else {
        const body = safeJson(response.data);
        if (body && body.result === 1) {
          if (body.userProfile && body.userProfile.profile) return body;
          return null; // Akun tidak ada.
        }
        lastError = new Error(
          `API profil SnackVideo menolak permintaan (result ${body?.result ?? '?'}${
            body?.error_msg ? `: ${body.error_msg}` : ''
          }).`,
        );
      }

      if (attempt === 0) await sleep(500);
    }

    throw lastError;
  }

  async getProfileFromPage(kwaiId) {
    const response = await this.request(
      {
        method: 'get',
        url: `${BASE_URL}/@${encodeURIComponent(kwaiId)}`,
        responseType: 'text',
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          referer: `${BASE_URL}/`,
        },
      },
      { retries: 1 },
    );

    if (response.status !== 200 || typeof response.data !== 'string') return null;

    const $ = cheerio.load(response.data);
    const title =
      $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const match = title.match(/\(@([^)]+)\)/i);

    if (!match || match[1].toLowerCase() !== kwaiId.toLowerCase()) return null;

    let nickname = title.slice(0, match.index).trim();
    if (!nickname) nickname = kwaiId;

    return {
      kwaiId,
      nickname,
      bio:
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        '',
    };
  }

  async fetchPage(url) {
    return this.request(
      {
        method: 'get',
        url,
        responseType: 'text',
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          referer: `${BASE_URL}/`,
        },
      },
      { retries: 1 },
    );
  }

  async searchWord(term, page) {
    const discoverUrl = `${BASE_URL}/discover/${encodeURIComponent(term)}`;
    let lastError = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await this.request({
        method: 'post',
        url: SEARCH_ENDPOINT,
        data: {
          ai_content: false,
          need_ld_json: false,
          need_tdk: false,
          searchWord: term,
          pcursor: page,
          count: 20,
          mobile: true,
          request_source: 1102,
          fromUser: false,
          seoDefaultFilterV2: true,
          url: discoverUrl,
        },
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/json',
          origin: BASE_URL,
          referer: discoverUrl,
        },
      });

      if (response.status !== 200) {
        lastError = new Error(`Pencarian gagal (HTTP ${response.status}).`);
      } else {
        const body = safeJson(response.data);
        if (body && body.result === 1) return body;

        lastError = new Error(
          `Pencarian SnackVideo gagal (result ${body?.result ?? '?'}${
            body?.error_msg ? `: ${body.error_msg}` : ''
          }).`,
        );
      }

      if (attempt === 0) await sleep(500);
    }

    throw lastError;
  }
}

async function resolveUsername(client, input, type) {
  if (type === 'url') {
    const direct = extractUsernameFromUrl(input);
    if (direct) return direct;

    const url = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    let response;
    try {
      response = await client.fetchPage(url);
    } catch (error) {
      throw new Error(`Gagal membuka URL: ${error.message}`);
    }

    if (response.status >= 400) {
      throw new Error(`Gagal membuka URL (HTTP ${response.status}).`);
    }

    const finalUrl = getFinalUrl(response);
    const fromFinalUrl = extractUsernameFromUrl(finalUrl);
    if (fromFinalUrl) return fromFinalUrl;

    if (typeof response.data === 'string') {
      const $ = cheerio.load(response.data);
      const canonical =
        $('link[rel="canonical"]').attr('href') ||
        $('meta[property="og:url"]').attr('content') ||
        '';
      const fromCanonical = extractUsernameFromUrl(canonical);
      if (fromCanonical) return fromCanonical;

      const embedded = response.data.match(/snackvideo\.com\/@([A-Za-z0-9._-]+)/i);
      if (embedded) return embedded[1];
    }

    throw new Error('Username tidak ditemukan pada URL SnackVideo tersebut.');
  }

  const username = String(input || '')
    .trim()
    .replace(/^@+/, '')
    .split(/[/?#]/)[0]
    .trim();

  if (!username || /\s/.test(username)) {
    throw new Error('Username SnackVideo tidak valid.');
  }
  return username;
}

async function getSingle(input, type, options) {
  const client = new SnackVideoClient(options);
  await client.init();

  const kwaiId = await resolveUsername(client, input, type);
  let profileError = null;
  let body = null;

  try {
    body = await client.getProfile(kwaiId);
  } catch (error) {
    profileError = error;
  }

  if (body) return profileResult(body, type, options);

  // Fallback ringan hanya saat API bermasalah. Jika API menjawab normal
  // tetapi tidak ada userProfile, akun memang tidak ditemukan.
  if (profileError) {
    try {
      const pageData = await client.getProfileFromPage(kwaiId);
      if (pageData) return partialFromPage(pageData, type);
    } catch {
      // Abaikan; error asli di bawah lebih informatif.
    }
    throw profileError;
  }

  return {
    status: 'not_found',
    search_type: type,
    query: input,
    message: `Akun SnackVideo "${kwaiId}" tidak ditemukan.`,
  };
}

async function searchByName(input, options) {
  const client = new SnackVideoClient(options);
  await client.init();

  const query = input.trim();
  const variants = buildQueryVariants(query);
  const candidates = new Map();
  let anySuccess = false;
  let lastError = null;

  const collectFeeds = (feeds, page) => {
    feeds.forEach((feed, index) => {
      const kwaiId = cleanText(feed.kwai_id);
      if (!kwaiId) return;

      const position = page * 20 + index;
      const existing = candidates.get(kwaiId);
      if (existing) {
        existing.seen += 1;
        existing.bestPos = Math.min(existing.bestPos, position);
        if (!existing.feedName && feed.user_name) existing.feedName = feed.user_name;
        return;
      }

      candidates.set(kwaiId, {
        kwaiId,
        feedName: cleanText(feed.user_name),
        feedBio: cleanText(feed.user_text ?? feed.userText),
        feedSex: feed.user_sex,
        feedUserId: feed.user_id ?? null,
        seen: 1,
        bestPos: position,
      });
    });
  };

  const runVariant = async (term, maxPages) => {
    for (let page = 0; page < maxPages; page += 1) {
      let body;
      try {
        body = await client.searchWord(term, page);
        anySuccess = true;
      } catch (error) {
        lastError = error;
        break;
      }

      const feeds = Array.isArray(body.feeds) ? body.feeds : [];
      if (!feeds.length) break;

      collectFeeds(feeds, page);
      if (feeds.length < 20) break;
    }
  };

  for (const term of variants) {
    await runVariant(term, options.pages);
  }

  // Pencarian kata kunci SnackVideo berbasis feed video. Untuk nama pendek
  // seperti "budi", akun sering muncul lewat variasi nama akun umum.
  const hasFeedMatch = [...candidates.values()].some(
    (candidate) =>
      nameScore(query, candidate.feedName, candidate.kwaiId) >= 24,
  );

  if (!hasFeedMatch) {
    const supplemental = [`${query} official`, `${query}123`];
    for (const term of supplemental) {
      await runVariant(term, 1);
    }
  }

  if (!anySuccess) {
    if (lastError) throw lastError;
    throw new Error('Pencarian SnackVideo gagal.');
  }

  if (!candidates.size) {
    return {
      status: 'not_found',
      search_type: 'name',
      query,
      count: 0,
      results: [],
      message: `Tidak ada akun yang ditemukan untuk "${query}".`,
    };
  }

  const rankedCandidates = [...candidates.values()]
    .map((candidate) => ({
      candidate,
      score:
        nameScore(query, candidate.feedName, candidate.kwaiId) +
        usernamePriority(query, candidate.kwaiId) * 3 +
        Math.min(6, candidate.seen * 1.5) +
        Math.max(0, 4 - candidate.bestPos / 10),
    }))
    .sort((a, b) => b.score - a.score || a.candidate.bestPos - b.candidate.bestPos)
    .map((item) => item.candidate);

  const maxCandidates = Math.min(50, Math.max(12, options.limit * 3));
  const selected = rankedCandidates.slice(0, maxCandidates);

  const fetched = await mapLimit(selected, options.concurrency, async (candidate) => {
    try {
      const body = await client.getProfile(candidate.kwaiId);
      if (!body) return null;
      return {
        candidate,
        result: profileResult(body, 'name', options),
      };
    } catch {
      return {
        candidate,
        result: partialFromFeed(candidate, 'name'),
      };
    }
  });

  const enriched = fetched
    .filter((item) => item && item.result)
    .map((item) => ({
      ...item,
      baseScore: nameScore(query, item.result.nickname, item.result.username),
      bonus:
        Math.min(6, item.candidate.seen * 1.5) +
        Math.max(0, 4 - item.candidate.bestPos / 10),
      priority: usernamePriority(query, item.result.username),
    }))
    .sort(
      (a, b) =>
        b.baseScore - a.baseScore ||
        b.priority - a.priority ||
        b.bonus - a.bonus ||
        a.candidate.bestPos - b.candidate.bestPos ||
        String(a.result.username).localeCompare(String(b.result.username)),
    );

  const results = [];
  const seenAccounts = new Set();
  const strongMatches = enriched.filter((item) => item.baseScore >= 68);
  const weakMatches = enriched.filter((item) => item.baseScore >= 24);

  let pool;
  if (strongMatches.length) {
    pool = enriched.filter((item) => item.baseScore >= 40);
  } else if (weakMatches.length) {
    pool = weakMatches;
  } else {
    return {
      status: 'not_found',
      search_type: 'name',
      query,
      count: 0,
      results: [],
      message: `Tidak ada akun dengan nama atau username yang cocok untuk "${query}".`,
    };
  }

  for (const item of pool) {
    const result = item.result;
    const key =
      result.user_id !== null && result.user_id !== undefined
        ? `id:${result.user_id}`
        : String(result.username || '').toLowerCase();

    if (key && seenAccounts.has(key)) continue;
    if (key) seenAccounts.add(key);

    results.push(result);
    if (results.length >= options.limit) break;
  }

  if (!results.length) {
    return {
      status: 'not_found',
      search_type: 'name',
      query,
      count: 0,
      results: [],
      message: `Tidak ada akun yang ditemukan untuk "${query}".`,
    };
  }

  return {
    status: 'success',
    search_type: 'name',
    query,
    count: results.length,
    results,
    ...(strongMatches.length
      ? {}
      : {
          note:
            'Tidak ada nama yang sangat cocok; hasil diurutkan dari akun dengan kemiripan nama/username terdekat.',
        }),
  };
}

/**
 * Scrape SnackVideo by name, username, or profile URL.
 *
 * @param {string} query
 * @param {object} [options]
 * @param {'auto'|'name'|'username'|'url'} [options.type='auto']
 * @param {number} [options.limit=10]
 * @param {number} [options.pages=2]
 * @param {number} [options.timeout=15000]
 * @param {boolean} [options.rawCounts=false]
 * @returns {Promise<object>}
 */
async function stalkSnackVideo(query, options = {}) {
  if (typeof query !== 'string' || !query.trim()) {
    throw new Error('Query wajib diisi (nama, username, atau URL profil).');
  }

  const normalized = normalizeOptions(options);
  const input = query.trim();
  const type = inferType(input, normalized.type);

  if (type === 'name') return searchByName(input, normalized);
  return getSingle(input, type, normalized);
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

function printHelp() {
  const text = `
SnackVideo Profile Scraper

Penggunaan:
  node scrape-stalk_snackvideo.js "<nama|@username|url>" [opsi]

Opsi:
  --name              Paksa pencarian berdasarkan nama
  --username          Paksa pencarian berdasarkan username
  --url               Paksa pencarian berdasarkan URL profil
  --limit <n>         Maksimal hasil pencarian nama (default: 10, maks: 50)
  --pages <n>         Halaman feed yang dipindai per variasi kata (default: 2)
  --timeout <ms>      Timeout tiap request (default: 15000)
  --type <mode>       auto | name | username | url (default: auto)
  --raw-counts        Tampilkan angka mentah, bukan format 1,2K
  --output <file>     Lokasi file JSON (default: result.json)
  -h, --help          Tampilkan bantuan

Contoh:
  node scrape-stalk_snackvideo.js "@snackvideoofficial"
  node scrape-stalk_snackvideo.js "https://www.snackvideo.com/@ninayumiof"
  node scrape-stalk_snackvideo.js "Nina Yumi" --name --limit 5
`.trim();
  process.stderr.write(`${text}\n`);
}

function parseCliArgs(argv) {
  const options = {
    type: 'auto',
    limit: DEFAULTS.limit,
    pages: DEFAULTS.pages,
    timeout: DEFAULTS.timeout,
    rawCounts: false,
    output: path.join(process.cwd(), 'result.json'),
    help: false,
  };
  const queryParts = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }
    if (arg === '--name') {
      options.type = 'name';
      continue;
    }
    if (arg === '--username') {
      options.type = 'username';
      continue;
    }
    if (arg === '--url') {
      options.type = 'url';
      continue;
    }
    if (arg === '--raw-counts') {
      options.rawCounts = true;
      continue;
    }

    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      const key = eq >= 0 ? arg.slice(0, eq) : arg;
      let value = eq >= 0 ? arg.slice(eq + 1) : argv[i + 1];

      if (eq < 0 && value !== undefined && !value.startsWith('--')) i += 1;

      if (key === '--limit') {
        options.limit = clampInt(value, options.limit, 1, 50);
      } else if (key === '--pages') {
        options.pages = clampInt(value, options.pages, 1, 10);
      } else if (key === '--timeout') {
        options.timeout = clampInt(value, options.timeout, 1000, 60000);
      } else if (key === '--output') {
        if (!value) throw new Error('Nilai --output wajib diisi.');
        options.output = path.resolve(value);
      } else if (key === '--type') {
        if (!['auto', 'name', 'username', 'url'].includes(value)) {
          throw new Error('Nilai --type harus: auto, name, username, atau url.');
        }
        options.type = value;
      } else {
        throw new Error(`Opsi tidak dikenal: ${key}`);
      }
      continue;
    }

    queryParts.push(arg);
  }

  return {
    ...options,
    query: queryParts.join(' ').trim(),
  };
}

function writeResultFile(filePath, result) {
  const json = `${JSON.stringify(result, null, 2)}\n`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, json, 'utf8');
  return json;
}

async function main() {
  let args;
  try {
    args = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n\n`);
    printHelp();
    process.exitCode = 2;
    return;
  }

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.query) {
    process.stderr.write('Error: Query wajib diisi.\n\n');
    printHelp();
    process.exitCode = 2;
    return;
  }

  let result;
  try {
    result = await stalkSnackVideo(args.query, {
      type: args.type,
      limit: args.limit,
      pages: args.pages,
      timeout: args.timeout,
      rawCounts: args.rawCounts,
    });
  } catch (error) {
    result = {
      status: 'error',
      search_type: args.type === 'auto' ? 'unknown' : args.type,
      query: args.query,
      message: error.message || String(error),
    };
  }

  let json;
  try {
    json = writeResultFile(args.output, result);
  } catch (error) {
    process.stderr.write(`Gagal menulis ${args.output}: ${error.message}\n`);
    json = `${JSON.stringify(result, null, 2)}\n`;
  }

  process.stdout.write(json);
  process.exitCode = result.status === 'success' ? 0 : 1;
}

module.exports = stalkSnackVideo;
module.exports.stalkSnackVideo = stalkSnackVideo;
module.exports.search = (name, options = {}) =>
  stalkSnackVideo(name, { ...options, type: 'name' });
module.exports.getProfile = (input, options = {}) => {
  const type = /^https?:\/\//i.test(String(input)) ? 'url' : 'username';
  return stalkSnackVideo(input, { ...options, type });
};
module.exports.formatCount = formatCount;
module.exports.buildQueryVariants = buildQueryVariants;

if (require.main === module) {
  main();
}
