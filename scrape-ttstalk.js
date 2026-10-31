/**
 * Name : Tiktok Stalk
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web : https://www.tiktok.com
 * Type : Scraper
 * Description : Stalk akun tiktok mantan lu
Note : Query/pencarian bisa berdasarkan name dan username "@". Contoh node scrape-ttstalk.js "mrbeast" hasil JSON yang didapat 10. Kalo berdasarkan "@username" hanya menghasilkan JSON 1, contoh node scrape-ttstalk.js "@razeerh.edukasi" paham kan? btw error fix sendiri
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright-core');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
const GLOBAL_TIMEOUT_MS = 420000;
const ENRICH_CONCURRENCY = Math.max(1, Math.min(3, Number(process.env.TTSTALK_CONCURRENCY) || 2));
const MAX_NAME_RESULTS = 10;

const DEBUG = !!process.env.TTSTALK_DEBUG;
const dbg = (...a) => { if (DEBUG) console.error('[debug]', ...a); };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChromium() {
  const candidates = [
    process.env.TTSTALK_CHROME_PATH,
    process.env.CHROME_PATH,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
    path.join(os.homedir(), '.cache', 'ms-playwright', 'chromium-1248', 'chrome-linux-arm64', 'chrome'),
    path.join(os.homedir(), '.cache', 'ms-playwright', 'chromium-1248', 'chrome-linux', 'chrome'),
    '/data/data/com.termux/files/usr/bin/chromium-browser',
    '/data/data/com.termux/files/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  for (const p of candidates) {
    try { if (fs.existsSync(p) && fs.statSync(p).isFile()) return p; } catch (e) {}
  }
  try { return chromium.executablePath(); } catch (e) {}
  return null;
}

function fail(message, extra) {
  const out = Object.assign({ status: 'gagal/error', message }, extra || {});
  console.log(JSON.stringify(out, null, 2));
  process.exit(1);
}

function num(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickStats(userInfo) {
  if (!userInfo) return {};
  const a = userInfo.stats || {};
  const b = userInfo.statsV2 || {};
  if (Number.isFinite(num(a.followerCount))) return a;
  return b;
}

function mapFromUserData(user, stats) {
  const uniqueId = user && user.uniqueId ? user.uniqueId : null;
  const s = stats || {};
  let avatar = null;
  if (user && user.avatarLarger) avatar = user.avatarLarger;
  else if (user && user.avatarMedium) avatar = user.avatarMedium;
  else if (user && user.avatarThumb && user.avatarThumb.url_list && user.avatarThumb.url_list.length) avatar = user.avatarThumb.url_list[0];
  return {
    profile: avatar,
    name: user && user.nickname !== undefined && user.nickname !== null ? user.nickname : null,
    username: uniqueId ? '@' + uniqueId : null,
    verified: user ? (user.verified ? 'Ya' : 'Tidak') : null,
    private: user && user.privateAccount !== undefined && user.privateAccount !== null ? (user.privateAccount ? 'Ya' : 'Tidak') : null,
    followers: num(s.followerCount),
    following: num(s.followingCount),
    likes: num(s.heartCount != null ? s.heartCount : s.heart),
    videos: num(s.videoCount),
    bio: user && user.signature !== undefined && user.signature !== null ? user.signature : null,
    profile_url: uniqueId ? 'https://www.tiktok.com/@' + uniqueId : null,
    user_id: user && user.id ? user.id : null,
  };
}

function mapFromSearchUser(info) {
  const uid = info.uid || null;
  const uniqueId = info.unique_id || null;
  const verifyStr = info.custom_verify || '';
  let avatar = null;
  if (info.avatar_thumb && Array.isArray(info.avatar_thumb.url_list) && info.avatar_thumb.url_list.length) {
    const list = info.avatar_thumb.url_list;
    const jpeg = list.filter((u) => u.indexOf('.jpeg') > -1);
    avatar = (jpeg.length ? jpeg[jpeg.length - 1] : list[list.length - 1]) || null;
  }
  return {
    profile: avatar,
    name: info.nickname || null,
    username: uniqueId ? '@' + uniqueId : null,
    verified: verifyStr ? 'Ya' : 'Tidak',
    private: null,
    followers: num(info.follower_count),
    following: null,
    likes: num(info.total_favorited),
    videos: null,
    bio: info.signature || null,
    profile_url: uniqueId ? 'https://www.tiktok.com/@' + uniqueId : null,
    user_id: uid,
  };
}

function mergeAccounts(primary, fallback) {
  const out = Object.assign({}, primary);
  if (fallback) {
    for (const k of Object.keys(out)) {
      if (out[k] === null && fallback[k] !== null && fallback[k] !== undefined) out[k] = fallback[k];
    }
  }
  return out;
}

function extractUserData(json) {
  const scope = json && json.__DEFAULT_SCOPE__;
  const detail = scope && scope['webapp.user-detail'];
  if (!detail) return { statusCode: null, statusMsg: null, userInfo: null };
  return { statusCode: detail.statusCode, statusMsg: detail.statusMsg, userInfo: detail.userInfo || null };
}

async function makeLaunch() {
  const exe = findChromium();
  if (!exe) fail('Executable Chromium/Chrome tidak ditemukan. Install Chromium (Termux: pkg install chromium) atau set TTSTALK_CHROME_PATH.');
  const browser = await chromium.launch({
    executablePath: exe,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  const contextOpts = {
    userAgent: UA,
    viewport: { width: 1280, height: 850 },
    locale: 'en-US',
    timezoneId: 'Asia/Jakarta',
  };
  if (fs.existsSync(COOKIE_FILE)) {
    try { contextOpts.storageState = COOKIE_FILE; } catch (e) {}
  }
  const context = await browser.newContext(contextOpts);
  await context.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'media' || type === 'font') return route.abort();
    return route.continue();
  });
  return { browser, context };
}

async function saveCookies(context, force) {
  try {
    if (force || !fs.existsSync(COOKIE_FILE)) {
      const state = await context.storageState();
      fs.writeFileSync(COOKIE_FILE, JSON.stringify(state));
    }
  } catch (e) {}
}

async function waitForUniversal(page, timeoutMs) {
  let data = null;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    data = await page.evaluate(() => {
      const s = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (!s) return null;
      try { return JSON.parse(s.textContent); } catch (e) { return { __parse_error: true }; }
    }).catch(() => null);
    if (data && !data.__parse_error) return data;
    if (Date.now() > deadline) return data;
    await sleep(1000);
  }
}

async function fetchProfilePage(context, username, attempts) {
  try {
    for (let i = 1; i <= attempts; i++) {
      const page = await context.newPage();
      try {
        await page.goto('https://www.tiktok.com/@' + encodeURIComponent(username), { waitUntil: 'commit', timeout: 40000 });
      } catch (e) {
        dbg('goto err (attempt ' + i + '):', e.message.slice(0, 100));
      }
      const data = await waitForUniversal(page, 40000);
      const ext = data ? extractUserData(data) : null;
      await page.close().catch(() => {});
      dbg('profile', username, 'attempt', i, 'ext=', ext ? { sc: ext.statusCode, hasInfo: !!ext.userInfo, msg: ext.statusMsg } : null);
      if (ext && ext.userInfo && ext.statusCode === 0) {
        await saveCookies(context, false);
        return { ok: true, userInfo: ext.userInfo };
      }
      if (ext && ext.statusCode !== null && ext.statusCode !== 0) {
        return { ok: false, notFound: true, statusCode: ext.statusCode, statusMsg: ext.statusMsg || '' };
      }
      await sleep(1500);
    }
  } catch (e) {
    dbg('fetchProfilePage context error:', e.message.slice(0, 100));
  }
  return { ok: false, notFound: false };
}

async function searchUsers(context, keyword, need) {
  const page = await context.newPage();
  const payloads = [];
  page.on('response', (resp) => {
    if (/\/api\/search\/user\/full\//.test(resp.url())) {
      resp.json().then((j) => {
        if (j && Array.isArray(j.user_list)) payloads.push(j);
      }).catch(() => {});
    }
  });

  let loaded = false;
  for (let attempt = 1; attempt <= 3 && !loaded; attempt++) {
    try {
      await page.goto('https://www.tiktok.com/search/user?q=' + encodeURIComponent(keyword), { waitUntil: 'commit', timeout: 40000 });
    } catch (e) {
      dbg('search goto err (attempt ' + attempt + '):', e.message.slice(0, 100));
    }
    for (let i = 0; i < 45 && payloads.length === 0; i++) await sleep(1000);
    if (payloads.length > 0) loaded = true;
    else if (attempt < 3) {
      try { await page.reload({ waitUntil: 'commit', timeout: 40000 }); } catch (e) {}
    }
  }
  if (!loaded) {
    await page.close().catch(() => {});
    return { ok: false, reason: 'Halaman pencarian gagal dimuat (kemungkinan WAF TikTok, koneksi lambat, atau tidak tersedia di region)' };
  }
  await saveCookies(context, false);

  const seen = new Map();
  const collect = () => {
    for (const p of payloads) {
      for (const item of p.user_list || []) {
        const info = item.user_info || item.user;
        const id = info && (info.uid || info.sec_uid);
        if (!id) continue;
        if (!seen.has(id)) seen.set(id, info);
      }
    }
  };
  collect();

  let lastHasMore = payloads.length ? payloads[payloads.length - 1].has_more : 1;
  for (let scroll = 0; scroll < 10 && seen.size < need && lastHasMore !== 0; scroll++) {
    const before = seen.size;
    try {
      await page.mouse.wheel(0, 2500);
      await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
    } catch (e) {}
    for (let i = 0; i < 8 && seen.size === before; i++) {
      await sleep(1000);
      collect();
      if (payloads.length) lastHasMore = payloads[payloads.length - 1].has_more;
    }
    collect();
    if (payloads.length) lastHasMore = payloads[payloads.length - 1].has_more;
  }

  const users = Array.from(seen.values()).slice(0, need);
  await page.close().catch(() => {});
  return { ok: true, users };
}

async function enrichTargets(launchState, targets) {
  const out = new Array(targets.length).fill(null);
  const browsers = [launchState.browser];
  let current = launchState;
  let ctxDead = false;
  let idx = 0;

  const markDead = () => { ctxDead = true; };
  current.context.on('close', markDead);
  current.browser.on('disconnected', markDead);

  while (idx < targets.length) {
    ctxDead = false;
    const worker = async () => {
      for (;;) {
        if (ctxDead) return 'DEAD';
        const my = idx++;
        if (my >= targets.length) return;
        if (out[my] !== null) continue;
        const t = targets[my];
        let res = null;
        try {
          if (t.username) res = await fetchProfilePage(current.context, t.username, 2);
        } catch (e) {
          markDead();
        }
        if (res && res.ok) {
          out[my] = mergeAccounts(mapFromUserData(res.userInfo.user, pickStats(res.userInfo)), t.searchMap);
        } else if (!ctxDead) {
          out[my] = t.searchMap;
        }
        if (ctxDead && out[my] === null) idx = Math.min(idx, my);
        if (ctxDead) return 'DEAD';
      }
    };
    const n = Math.min(ENRICH_CONCURRENCY, targets.length - idx);
    const states = await Promise.all(Array.from({ length: Math.max(1, n) }, () => worker()));
    if (states.every((s) => s !== 'DEAD') || idx >= targets.length) break;
    if (idx < targets.length && ctxDead) {
      dbg('context/browser musnah, re-launch baru untuk sisa', targets.length - idx, 'akun');
      const rel = await makeLaunch();
      browsers.push(rel.browser);
      rel.context.on('close', markDead);
      rel.context.on('close', () => {});
      rel.browser.on('disconnected', markDead);
      current = rel;
      ctxDead = false;
    }
  }

  return { browsers, results: out.map((v, i) => v || (targets[i] ? targets[i].searchMap : null)) };
}

async function closeAll(browsers) {
  for (const b of browsers) { try { await b.close(); } catch (e) {} }
}

function parseArg(argv) {
  const args = argv.slice(2).filter((a) => a.trim() !== '');
  if (args.length === 0) return { valid: false, error: 'Query tidak boleh kosong. Contoh: node scrape-ttstalk.js "razeerh eduvibe" atau "@razeerh.edukasi"' };
  if (args.length > 1) return { valid: false, error: 'Gunakan satu query saja (diapit tanda kutip). Contoh: node scrape-ttstalk.js "razeerh eduvibe"' };
  const raw = args[0].trim().replace(/^["'`]+|["'`]+$/g, '').trim();
  if (!raw) return { valid: false, error: 'Query tidak valid.' };
  if (raw.charAt(0) === '@') {
    const uname = raw.slice(1).trim();
    if (!/^[A-Za-z0-9._]{1,35}$/.test(uname)) return { valid: false, error: 'Format username tidak valid: ' + raw + ' (hanya huruf, angka, titik, underscore)' };
    return { valid: true, mode: 'username', username: uname.toLowerCase() };
  }
  if (raw.length < 2 || raw.length > 100) return { valid: false, error: 'Query pencarian nama terlalu pendek atau terlalu panjang.' };
  return { valid: true, mode: 'name', keyword: raw };
}

async function main() {
  const parsed = parseArg(process.argv);
  if (!parsed.valid) fail(parsed.error);

  const watchdog = setTimeout(() => fail('Timeout global: proses melebihi ' + GLOBAL_TIMEOUT_MS / 1000 + ' detik'), GLOBAL_TIMEOUT_MS);
  watchdog.unref();

  const browsersAll = [];
  try {
    const launch = await makeLaunch();
    browsersAll.push(launch.browser);

    if (parsed.mode === 'username') {
      const res = await fetchProfilePage(launch.context, parsed.username, 3);
      if (!res.ok) {
        if (res.notFound) fail('Akun @' + parsed.username + ' tidak ditemukan (' + (res.statusMsg ? res.statusMsg : 'statusCode ' + res.statusCode) + ')');
        fail('Gagal mengambil profil @' + parsed.username);
      }
      const acc = mapFromUserData(res.userInfo.user, pickStats(res.userInfo));
      clearTimeout(watchdog);
      await closeAll(browsersAll);
      console.log(JSON.stringify({ status: 'sukses', mode: 'username', count: 1, results: [acc] }, null, 2));
      process.exit(0);
    }

    const search = await searchUsers(launch.context, parsed.keyword, MAX_NAME_RESULTS);
    if (!search.ok) {
      clearTimeout(watchdog);
      await closeAll(browsersAll);
      fail(search.reason);
    }
    if (search.users.length === 0) {
      clearTimeout(watchdog);
      await closeAll(browsersAll);
      fail('Tidak ditemukan akun untuk "' + parsed.keyword + '"');
    }
    const targets = search.users.map((info) => ({ username: info.unique_id || null, searchMap: mapFromSearchUser(info) }));
    let results = (await enrichTargets(launch, targets)).results;
    results = results.filter((r) => r && r.username);
    const outPayload = { status: 'sukses', mode: 'name', query: parsed.keyword, count: results.length, results };
    if (results.length < MAX_NAME_RESULTS) outPayload.note = 'Hanya ditemukan ' + results.length + ' akun';
    clearTimeout(watchdog);
    await closeAll(browsersAll);
    console.log(JSON.stringify(outPayload, null, 2));
    process.exit(0);
  } catch (e) {
    await closeAll(browsersAll);
    fail('Gagal: ' + (e && e.message ? e.message : String(e)));
  }
}

process.on('uncaughtException', (e) => fail('Kesalahan internal: ' + (e && e.message ? e.message : String(e))));
process.on('unhandledRejection', (e) => fail('Kesalahan tidak tertangani: ' + (e && e.message ? e.message : String(e))));

main();
