#!/usr/bin/env node

/**
 * Name : Text-To-Image AI
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web : https://perchance.org/ai-text-to-image-generator
 * Type : Scraper
 * Description : Perchance AI Text-to-Image Generatormenghasilkan gambar menggunakan AI berdasarkan prompt teks. Lu pada cukup memasukkan deskripsi gambar, memilih gaya visual, menentukan rasio gambar, mengatur jumlah hasil, lalu menghasilkan gambar secara otomatis.
 * Note : Sempat gagal 6x gegara cf turnstile nolak IP/Datacenter trus serta chromium di kill + UserKey expired, gw coba bypass pakai CaptchaX punya omnify sambil dibantu AI hasilnya tembus, serta 
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { chromium } = require('playwright-core');

const GEN_URL = 'https://perchance.org/ai-text-to-image-generator';
const SERVER_ORIGIN = 'https://image-generation.perchance.org';
const DEFAULT_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.8059.84 Safari/537.36';
const STATE_MAX_AGE_MIN = 19;

const ua = process.env.SCRAPER_UA || DEFAULT_UA;
const stateFile = process.env.SCRAPER_STATE || path.join(process.cwd(), '.perchance-state.json');

const FALLBACK_META = {
  artStyles: ['Painted Anime', 'Casual Photo', 'Cinematic', 'Digital Painting', 'Concept Art', 'No style', '3D Disney Character', '2D Disney Character', 'Disney Sketch', 'Concept Sketch', 'Painterly', 'Oil Painting', 'Oil Painting - Realism', 'Oil Painting - Old', 'Oil Painting - 70s Pulp', 'Professional Photo', 'Anime', 'Drawn Anime', 'Anime Screencap', 'Cute Anime', 'Soft Anime', 'Fantasy Painting', 'Fantasy Landscape', 'Fantasy Portrait', 'Studio Ghibli', '50s Enamel Sign', 'Vintage Comic', 'Franco-Belgian Comic', 'Tintin Comic', 'Medieval', 'Pixel Art', 'Furry - Oil', 'Furry - Cinematic', 'Furry - Painted', 'Furry - Drawn', 'Cute Figurine', '3D Emoji', 'Illustration', 'Cute Illustration', 'Flat Illustration', 'Watercolor', '1990s Photo', '1980s Photo', '1970s Photo', '1960s Photo', '1950s Photo', '1940s Photo', '1930s Photo', '1920s Photo', 'Vintage Pulp Art', '50s Infomercial Anime', '3D Pokemon', 'Painted Pokemon', '2D Pokemon', 'Vintage Anime', 'Neon Vintage Anime', 'Manga', 'Fantasy World Map', 'Fantasy City Map', 'Old World Map', '3D Isometric Icon', 'Flat Style Icon', 'Flat Style Logo', 'Game Art Icon', 'Digital Painting Icon', 'Concept Art Icon', 'Cute 3D Icon', 'Crayon Drawing', 'Pencil', 'Tattoo Design', 'Waifu', 'YuGiOh Art', 'Traditional Japanese', 'Nihonga Painting', 'Claymation', 'Cartoon', 'Cursed Photo', 'MTG Card'],
  shapes: [{ text: 'Square', value: '768x768' }, { text: 'Portrait', value: '512x768' }, { text: 'Landscape', value: '768x512' }],
  numImages: ['2', '4', '6', '8', '16', '32'],
  defaultGuidanceScale: 7,
  engine: SERVER_ORIGIN + '/embed',
};

function ts() { return new Date().toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-'); }
function logLine(...a) { console.error('[scrape]', ...a); }
function humanBytes(n) { if (n == null) return ''; const u = ['B', 'KB', 'MB', 'GB']; let i = 0, v = n; while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; } return (i ? v.toFixed(1) : v) + ' ' + u[i]; }
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
function compactText(s, n) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, n || 120); }

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      if (a.includes('=')) { const k = a.slice(2, a.indexOf('=')).replace(/-(\w)/g, (_, c) => c.toUpperCase()); out[k] = a.slice(a.indexOf('=') + 1); continue; }
      const key = a.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase());
      const next = argv[i + 1];
      if (next === undefined || (next.startsWith('--') && !/^-?\d/.test(next))) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

function findChromium() {
  const candidates = [];
  if (process.env.SCRAPER_CHROME) candidates.push(process.env.SCRAPER_CHROME);
  candidates.push(process.env.CHROME_PATH, '/tmp/edgec-root/usr/lib/chromium/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/snap/bin/chromium', '/data/data/com.termux/files/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe');
  for (const c of candidates) { if (c && fs.existsSync(c)) return c; }
  const here = cp.execSync('command -v chromium || command -v chromium-browser || command -v google-chrome 2>/dev/null || true').toString().trim();
  return here || null;
}

function ensureXvfb() {
  if (process.env.DISPLAY) return process.env.DISPLAY;
  try { cp.execSync('pgrep -x Xvfb'); return ':77'; } catch (e) {
    try {
      cp.execSync('setsid /usr/bin/Xvfb :77 -screen 0 1280x800x24 -ac > /dev/null 2>&1 < /dev/null & sleep 1.5');
      return ':77';
    } catch (e2) { return null; }
  }
}

function chromeEnv(chromePath) {
  const env = { ...process.env };
  if (chromePath.startsWith('/tmp/edgec-root')) {
    env.LD_LIBRARY_PATH = '/tmp/edgec-root/usr/lib' + (env.LD_LIBRARY_PATH ? ':' + env.LD_LIBRARY_PATH : '');
    env.VK_ICD_FILENAMES = '/tmp/edgec-root/usr/lib/chromium/vk_swiftshader_icd.json';
  }
  const display = ensureXvfb();
  if (display) env.DISPLAY = display;
  return env;
}

function killChrome() {
  if (process.env.SCRAPER_NO_KILL) return;
  try { cp.execSync('pkill -9 chromium; pkill -9 chrome; true'); } catch (e) { /* noop */ }
}

function purgeStaleState() {
  if (process.env.SCRAPER_FRESH) { try { fs.unlinkSync(stateFile); } catch (e) { /* noop */ } return undefined; }
  try {
    const st = fs.statSync(stateFile);
    const ageMin = (Date.now() - st.mtimeMs) / 60000;
    const j = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const img = (j.origins || []).find((o) => /image-generation/.test(o.origin));
    const hasUserKey = !!(img && (img.localStorage || []).some((e) => /:userKey-/.test(e.name) && e.value));
    const maxAge = hasUserKey ? 24 * 60 : STATE_MAX_AGE_MIN;
    if (ageMin > maxAge) { fs.unlinkSync(stateFile); logLine('state purged (' + ageMin.toFixed(0) + ' min old' + (hasUserKey ? ', ada userKey' : '') + ')'); return undefined; }
    logLine('state reused (' + ageMin.toFixed(0) + ' min old' + (hasUserKey ? ', userKey tercache' : '') + ')');
    return stateFile;
  } catch (e) { return undefined; }
}

async function passChallenge(page, maxWaitMs) {
  try { await page.waitForFunction("() => !/Just a moment/i.test(document.title || '')", null, { timeout: maxWaitMs }); } catch (e) { /* keep going */ }
  return !/just a moment/i.test((await page.title().catch(() => 'x')) || '');
}

function intOr(v, d) { const n = parseInt(String(v), 10); return Number.isFinite(n) ? n : d; }

function imageInfo(buf) {
  if (!buf || buf.length < 24) return { format: 'unknown', width: null, height: null };
  const b = Buffer.from(buf);
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47 && b[4] === 0x0d) return { format: 'PNG', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o < b.length - 4) {
      if (b[o] !== 0xff) { o++; continue; }
      const marker = b[o + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { format: 'JPEG', height: b.readUInt16BE(o + 5), width: b.readUInt16BE(o + 7) };
      const len = b.readUInt16BE(o + 2);
      if (len <= 0) break;
      o += 2 + len;
    }
    return { format: 'JPEG', width: null, height: null };
  }
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') {
    const fmt = b.readUInt32LE(12);
    if (fmt === 0x56502049) return { format: 'WEBP', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (fmt === 0x53504544) return { format: 'WEBP', width: 1 + b.readUInt32LE(24) & 0xffffff, height: 1 + (b.readUInt32LE(24) >>> 14) & 0x3fff };
  }
  return { format: 'unknown', width: null, height: null };
}

function resolveStyle(opts, meta) {
  const styles = (meta.artStyles || []).filter(Boolean);
  const want = String(opts.style || '').trim();
  if (!want) return { requested: styles[0] || null, applied: styles[0] || null, exact: true };
  const low = want.toLowerCase();
  const hit = styles.find((s) => s.toLowerCase() === low) || styles.find((s) => s.toLowerCase().includes(low));
  return { requested: want, applied: hit || styles[0] || null, exact: !!hit };
}

function resolveShape(opts, meta) {
  const val = String(opts.shape || opts.resolution || '').trim();
  if (!val) return null;
  const shapes = (meta.shapes || FALLBACK_META.shapes);
  const byName = shapes.find((s) => s.text.toLowerCase() === val.toLowerCase());
  if (byName) return { requested: val, value: byName.value, uiShape: byName.text, exact: true };
  const byValue = shapes.find((s) => s.value === val.toLowerCase());
  if (byValue) return { requested: val, value: byValue.value, uiShape: byValue.text, exact: true };
  const m = /^\s*(\d{3,4})\s*[xX*]\s*(\d{3,4})\s*$/.exec(val);
  if (!m) throw new Error('shape tidak valid: ' + val + ' (pilihan: ' + shapes.map((s) => s.text).join(', ') + ' atau WxH)');
  const r = m[1] + 'x' + m[2];
  if (!['512x512', '512x768', '768x512', '768x768'].includes(r)) throw new Error('resolusi ' + r + ' tidak didukung engine (512x512, 768x768, 512x768, 768x512)');
  const near = shapes.reduce((best, s) => {
    const av = s.value.split('x').map(Number), bv = best.value.split('x').map(Number), rv = r.split('x').map(Number);
    return Math.abs(av[0] * av[1] - rv[0] * rv[1]) < Math.abs(bv[0] * bv[1] - rv[0] * rv[1]) ? s : best;
  }, shapes[0]);
  return { requested: val, value: r, uiShape: near.text, exact: r !== '512x512', token: r === '512x512' || !(shapes.some((s) => s.value === r)) ? r : null };
}

function resolveCount(opts, meta) {
  const want = Math.max(1, intOr(opts.count || '4', 4));
  const avail = (meta.numImages || FALLBACK_META.numImages).map((x) => intOr(x, NaN)).filter(Number.isFinite).filter((x) => x > 1).sort((a, b) => a - b);
  let chosen = avail.find((v) => v >= want);
  if (!chosen) chosen = avail[avail.length - 1];
  return { want, chosen, avail };
}

async function ensureMessageCollector(p) {
  await p.addInitScript(() => {
    try {
      if (!window.__t2iFinished) {
        window.__t2iFinished = [];
        window.addEventListener('message', (ev) => {
          try {
            if (ev.data && ev.data.type === 'finished' && ev.data.dataUrl) window.__t2iFinished.push({ dataUrl: ev.data.dataUrl, seedUsed: ev.data.seedUsed, id: ev.data.id, at: Date.now() });
          } catch (e) { /* noop */ }
        });
      }
    } catch (e) { /* noop */ }
  });
}

async function uiReadMetadata(engineFrame) {
  return engineFrame.evaluate(() => {
    const sel = (name) => {
      const s = [...document.querySelectorAll('select')].find((x) => x.dataset.name === name);
      if (!s) return null;
      return { value: s.value, options: [...s.options].map((o) => ({ text: o.textContent.trim(), value: o.value })) };
    };
    const art = sel('artStyle'), shape = sel('shape'), num = sel('numImages');
    const tas = [...document.querySelectorAll('textarea')].map((t) => ({ placeholder: (t.placeholder || '').slice(0, 60) }));
    const anti = [...document.querySelectorAll('*')].map((e) => (e.textContent || '').trim()).find((t) => t && t.length < 60 && /anti-desc|negative/i.test(t) && !/\n/.test(t));
    return {
      artStyle: art,
      shape: shape,
      numImages: num,
      promptPlaceholder: (tas.find((t) => /ukrainian|beautiful|detail/i.test(t.placeholder)) || tas[tas.length - 1] || {}).placeholder || null,
      antiDescLabel: anti || null,
    };
  }).catch(() => null);
}

async function uiFillEngine(engineFrame, params) {
  return engineFrame.evaluate((p) => {
    const tas = [...document.querySelectorAll('textarea')];
    const pt = tas.find((t) => /ukrainian|beautiful|detail/i.test(t.placeholder || '')) || tas[tas.length - 1];
    if (!pt) return { fail: 'textarea prompt tidak ditemukan' };
    pt.value = p.prompt;
    pt.dispatchEvent(new Event('input', { bubbles: true }));
    pt.dispatchEvent(new Event('change', { bubbles: true }));
    let negInField = false;
    if (p.negativePrompt) {
      const ctn = [...document.querySelectorAll('td,div,span,label')].filter((e) => /anti-desc|negative/i.test(e.textContent || '') && e.children.length <= 5).pop();
      const q = ctn && (ctn.matches('input,textarea') ? ctn : ctn.querySelector('textarea,input[type=text]'));
      if (q) { q.value = p.negativePrompt; q.dispatchEvent(new Event('input', { bubbles: true })); q.dispatchEvent(new Event('change', { bubbles: true })); negInField = true; }
    }
    const setSel = (name, val) => {
      const s = [...document.querySelectorAll('select')].find((x) => x.dataset.name === name);
      if (!s) return { fail: name + ' select tidak ditemukan' };
      const want = String(val).trim().toLowerCase();
      const opts = [...s.options];
      const hit = opts.find((o) => String(o.value).toLowerCase() === want) || opts.find((o) => o.textContent.trim().toLowerCase() === want) || opts.find((o) => o.textContent.trim().toLowerCase().startsWith(want));
      if (!hit) return { fail: name + ': opsi ' + val + ' tidak ada', have: opts.map((o) => o.textContent.trim()) };
      s.value = hit.value;
      s.dispatchEvent(new Event('change', { bubbles: true }));
      return hit.textContent.trim();
    };
    return { promptLen: pt.value.length, negInField, styleRes: p.artStyle ? setSel('artStyle', p.artStyle) : null, shapeRes: p.shape ? setSel('shape', p.shape) : null, countRes: p.numImages ? setSel('numImages', p.numImages) : null };
  }, params);
}

async function harvestResults(engineFrame, wantCount, timeoutMs) {
  const t0 = Date.now();
  let lastLen = -1;
  let st = { msgs: [], imgs: [] };
  while (Date.now() - t0 < timeoutMs) {
    await wait(5000);
    const cur = await engineFrame.evaluate(() => ({
      msgs: (window.__t2iFinished || []).slice(),
      imgs: [...document.querySelectorAll('img')].filter((i) => /^(data:image|https:\/\/image-generation\.perchance\.org)/.test(i.currentSrc || i.src || '')).map((i) => ({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight })),
    })).catch((e) => ({ err: e.message }));
    if (cur.err) { if (Date.now() - t0 > 20000) throw new Error('engine frame hilang saat menunggu hasil: ' + compactText(cur.err, 120)); continue; }
    st = cur;
    if ((st.msgs.length || st.imgs.length) !== lastLen) { lastLen = st.msgs.length || st.imgs.length; logLine('hasil masuk: ' + lastLen + '/' + wantCount); }
    if (st.msgs.length >= wantCount || st.imgs.length >= wantCount) break;
  }
  return st;
}

async function mintAndStoreUserKey(ctx, logLine) {
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); } catch (e) { /* noop */ } });
  try {
    await page.goto(SERVER_ORIGIN + '/embed', { timeout: 100000, waitUntil: 'domcontentloaded' });
    await passChallenge(page, 60000);
    const bid = await page.evaluate(async () => { await window.generationIdentity.ready; return window.generationIdentity.id; }).catch(() => null);
    if (!bid) throw new Error('generationIdentity tidak tersedia di embed');
    logLine('mint: browserId=' + bid.slice(0, 10) + '...');
    await page.evaluate(() => {
      document.body.innerHTML = '<div id="ctn" style="width:300px;height:70px"></div>';
      window.__token = null; window.__err = null;
      window.onLoadApi = () => {
        window.__wid = window.turnstile.render('#ctn', {
          sitekey: '0x4AAAAAAAA8g8NphwaSOT59',
          callback: (t) => { window.__token = t; },
          'error-callback': (e) => { window.__err = String(e); },
          'expired-callback': () => { window.__err = 'expired'; },
        });
      };
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onLoadApi';
      s.async = true;
      document.head.appendChild(s);
    });
    let token = null, widErr = null;
    for (let i = 0; i < 22 && !token; i++) {
      await wait(4000);
      const st = await page.evaluate(() => ({ tok: window.__token, err: window.__err })).catch(() => ({ err: 'pageHilang' }));
      if (st.tok) { token = st.tok; break; }
      if (st.err && st.err !== 'pageHilang') { widErr = st.err; break; }
    }
    if (!token) { const e = new Error(widErr ? 'turnstile widget error: ' + widErr : 'turnstile tidak memberikan token (env/IP ditolak)'); e.code = 'TURNSTILE'; throw e; }
    const res = await page.evaluate(async (tk) => {
      try {
        await window.generationIdentity.ready;
        const id = window.generationIdentity.id;
        const r = await fetch('/api/verifyUser?browserId=' + id + '&thread=0&token=' + encodeURIComponent(tk) + '&__cacheBust=' + Math.random());
        return { st: r.status, body: (await r.text()).slice(0, 400) };
      } catch (e) { return { st: 'ERR', body: e.message }; }
    }, token);
    const body = JSON.parse(res.body || '{}');
    if (!body.userKey) throw new Error('verifyUser gagal: ' + res.st + ' ' + String(res.body).slice(0, 140));
    logLine('mint sukses! userKey:', body.userKey.slice(0, 12) + '...');
    await page.evaluate((uk) => {
      const id = window.generationIdentity.id;
      localStorage.setItem('generation-v2:' + id + ':userKey-0', uk);
      localStorage.setItem('generation-v2:' + id + ':recentlyVerified-0', String(Date.now()));
    }, body.userKey);
    await ctx.storageState({ path: stateFile }).catch((e) => logLine('state save err:', e.message));
    return { userKey: body.userKey, browserId: bid };
  } finally {
    await page.close().catch(() => { /* noop */ });
  }
}

async function runUiMode(ctx, page, opts, endpointLog, imageResponses) {
  const meta = FALLBACK_META;
  await page.goto(GEN_URL, { timeout: 120000, waitUntil: 'domcontentloaded' });
  const ok = await passChallenge(page, 100000);
  logLine('cf challenge pass:', ok, '| title:', compactText(await page.title().catch(() => ''), 50));
  await ctx.storageState({ path: stateFile }).catch((e) => logLine('state save err:', e.message));
  if (!ok) throw new Error('cloudflare challenge tidak lolos dalam batas waktu');

  let engine = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 80000 && !engine) {
    for (const f of page.frames()) {
      const has = await f.evaluate(() => !!document.querySelector('select[data-name="artStyle"]')).catch(() => false);
      if (has) { engine = f; break; }
    }
    if (!engine) await wait(2500);
  }
  if (!engine) throw new Error('engine frame tidak ditemukan (generator gagal termuat)');
  logLine('engine frame siap:', compactText(engine.url(), 70));

  const metaLive = await uiReadMetadata(engine);
  const mergedMeta = {
    artStyles: (metaLive && metaLive.artStyle && metaLive.artStyle.options.map((o) => o.text).filter(Boolean)) || meta.artStyles,
    shapes: (metaLive && metaLive.shape && metaLive.shape.options) || meta.shapes,
    numImages: (metaLive && metaLive.numImages && metaLive.numImages.options.map((o) => o.text)) || meta.numImages,
    antiFieldDetected: !!(metaLive && metaLive.antiDescLabel),
    defaultGuidanceScale: meta.defaultGuidanceScale,
    engine: meta.engine,
  };

  const styleR = resolveStyle(opts, mergedMeta);
  const shapeR = resolveShape({ shape: opts.shape || 'Square' }, mergedMeta);
  const countR = resolveCount(opts, mergedMeta);
  let prompt = String(opts.prompt).trim();
  if (opts.negative) prompt += ' (negativePrompt:::' + opts.negative + ')';
  if (opts.guidance) prompt += ' (guidanceScale:::' + intOr(opts.guidance, 7) + ')';
  if (shapeR && shapeR.token) prompt += ' (resolution:::' + shapeR.token + ')';
  if (opts.seed !== undefined && opts.seed !== true) prompt += ' (seed:::' + intOr(opts.seed, -1) + ')';

  const fill = await uiFillEngine(engine, {
    prompt,
    negativePrompt: opts.negative || '',
    artStyle: styleR.applied,
    shape: shapeR ? shapeR.uiShape : null,
    numImages: String(countR.chosen),
  });
  logLine('input terisi:', JSON.stringify(fill));
  for (const k of ['styleRes', 'shapeRes', 'countRes']) {
    if (fill[k] && typeof fill[k] === 'object' && fill[k].fail) throw new Error(fill[k].fail + (fill[k].have ? ' | tersedia: ' + fill[k].have.join(' | ') : ''));
  }
  await wait(400);

  logLine('klik Generate...');
  await engine.locator('button:has-text("Generate")').first().click({ timeout: 20000 }).catch(async (e) => {
    logLine('locator click gagal (' + compactText(e.message, 60) + '), fallback dispatch');
    await engine.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /generate/i.test(x.textContent || '')); if (b) b.click(); });
  });

  logLine('menunggu ' + countR.chosen + ' gambar (maks ' + Math.round((opts.genTimeout || 300000) / 1000) + ' s)...');
  const finished = await harvestResults(engine, countR.chosen, opts.genTimeout || 300000);

  let all = (finished.msgs || []).map((m) => ({ dataUrl: m.dataUrl, seed: m.seedUsed }));
  if (all.length < countR.chosen) {
    for (const i of finished.imgs || []) if (/^data:image/.test(i.src)) all.push({ dataUrl: i.src, seed: undefined });
  }
  if (all.length < countR.chosen) {
    for (const res of imageResponses) {
      try {
        const buf = await res.body();
        all.push({ dataUrl: 'data:' + (res.headers()['content-type'] || 'image/png').split(';')[0] + ';base64,' + buf.toString('base64'), seed: undefined });
      } catch (e) { /* noop */ }
    }
  }

  const bodyText = await engine.evaluate(() => document.body.innerText).catch(() => '');
  const errorLines = (bodyText.match(/[^\n]*(quota|too fast|failed|error|try again|slow down|need a moment|verification)[^\n]*/gi) || []).map((s) => compactText(s, 140)).slice(0, 3);

  return {
    results: all.slice(0, countR.chosen),
    meta: mergedMeta,
    endpoints: endpointLog,
    errorLines,
    wanted: { style: styleR, shape: shapeR, count: countR },
  };
}

async function runGenerationOnce(opts, authTracker) {
  const lastVerify = authTracker || {};
  const endpointLog = [];
  const chrome = findChromium();
  if (!chrome) throw new Error('chromium tidak ditemukan. set SCRAPER_CHROME=/path/to/chromium lalu coba lagi');
  killChrome();
  const storageState = purgeStaleState();
  const browser = await chromium.launch({
    executablePath: chrome,
    // PENTING: WebGL/swiftshader (software GPU) membantu CPU render TAPI Turnstile menandai SwiftShader
    // sebagai otomasi -> challenge selalu gagal 600010. Solusi teruji: MATIKAN WebGL total.
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage', '--disable-webgl', '--disable-webgl2', '--disable-webgpu', '--force-color-profile=srgb', '--force-device-scale-factor=1', '--mute-audio', '--hide-scrollbars'],
    headless: process.env.SCRAPER_HEADLESS === '1',
    env: chromeEnv(chrome),
  });
  const imageResponses = [];
  try {
    const ctx = await browser.newContext({ userAgent: ua, viewport: { width: 1100, height: 800 }, locale: 'en-US', storageState });
    await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); } catch (e) {} });
    const page = await ctx.newPage();
    await ensureMessageCollector(page);
    page.on('response', (r) => {
      const u = r.url();
      if (u.startsWith(SERVER_ORIGIN)) {
        const ct = (r.headers()['content-type'] || '').split(';')[0];
        endpointLog.push(r.status() + ' ' + u.replace(SERVER_ORIGIN, '').slice(0, 100) + ' [' + ct + ']');
        if (r.status() === 200 && /image\//.test(ct) && r.request().resourceType() !== 'document') imageResponses.push(r);
        if (u.includes('/api/verifyUser') && !lastVerify.blocked) {
          r.text().then((t) => {
            try {
              const j = JSON.parse(t);
              if (j && (j.status === 'failed_verification' || j.reason)) { lastVerify.reason = j.reason; lastVerify.status = j.status; lastVerify.fails = (lastVerify.fails || 0) + 1; }
              if (j && j.status === 'success') { lastVerify.ok = true; lastVerify.okBody = t.slice(0, 200); lastVerify.blocked = false; try { ctx.storageState({ path: stateFile }); } catch (e) { /* noop */ } }
            } catch (e) { lastVerify.raw = t.slice(0, 120); }
          }).catch(() => lastVerify.raw = '(body tidak terbaca)');
        }
      }
    });
    if (opts.light) {
      await page.route((u) => {
        const href = typeof u === 'string' ? u : u.href;
        return /perchance\.org/.test(href) && !u.pathname.startsWith('/ai-text-to-image-generator');
      }, (route) => {
        const rt = route.request().resourceType();
        if (rt === 'font' || rt === 'media' || rt === 'image') return route.abort();
        if (/google-analytics|googletagmanager|doubleclick|adservice/.test(route.request().url())) return route.abort();
        return route.continue();
      });
    }
    if (process.env.SCRAPER_SKIP_MINT || lastVerify.mintFailed) { if (!process.env.SCRAPER_SKIP_MINT) logLine('mint dilewati (Turnstile sudah ditolak sekali di run ini)'); }
    else {
      try {
        logLine('mint userKey (halaman ringan, 1x per jaringan baru)...');
        const m = await mintAndStoreUserKey(ctx, logLine);
        lastVerify.ok = true; lastVerify.okBody = 'userKey=' + m.userKey;
        logLine('userKey siap di localStorage — generasi akan melewati verifikasi');
      } catch (e) {
        lastVerify.reason = e.code === 'TURNSTILE' ? 'token_required' : 'mint_error';
        lastVerify.status = 'failed_verification';
        lastVerify.mintFailed = true;
        logLine('mint gagal:', compactText(e.message, 130));
      }
    }
    const res = await runUiMode(ctx, page, opts, endpointLog, imageResponses);
    res.lastVerify = Object.assign({}, lastVerify);
    if (lastVerify.reason === 'token_required') res.authBlocked = true;
    return res;
  } finally {
    try { await browser.close(); } catch (e) { /* noop */ }
  }
}

function printResult(r) {
  console.log('');
  console.log('Status: ' + (r.status.success ? 'success' : 'FAILED — ' + r.status.failure));
  console.log('Prompt: ' + r.prompt);
  if (r.negativePrompt) console.log('Negative: ' + r.negativePrompt);
  console.log('Art Style: ' + (r.artStyle.applied || '-') + (r.artStyle.requested && !r.artStyle.exact ? ' (diminta "' + r.artStyle.requested + '")' : ''));
  console.log('Shape (rasio/ukuran): ' + (r.shape.appliedResolution || '-') + (r.shape.uiLabel ? ' (' + r.shape.uiLabel + ')' : ''));
  console.log('Jumlah Gambar: ' + r.jumlahGambar.hasil + (r.jumlahGambar.diminta !== r.jumlahGambar.hasil ? ' (diminta ' + r.jumlahGambar.diminta + ', tersedia ' + r.jumlahGambar.tersediaDariGenerator.join(',') + ')' : ''));
  console.log('Hasil Generate:');
  if (!r.hasilGenerate.length) console.log('  (tidak ada gambar tersimpan)');
  for (const im of r.hasilGenerate) {
    console.log('  - ' + im.file + '  [' + [im.format, im.dimensi, im.ukuran, im.seed != null ? 'seed ' + im.seed : null].filter(Boolean).join(', ') + ']');
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h || args.usage) {
    console.log(`Penggunaan:
  node scrape-txt2img.js --prompt "teks prompt" [opsi]

Opsi:
  --prompt, -p       prompt teks (wajib)
  --style            nama/gaya art style (default: Painted Anime; daftar lengkap ada di report JSON)
  --shape            Square | Portrait | Landscape | 512x512 | 768x768 | 512x768 | 768x512
  --count, -n        jumlah gambar (tersedia 2, 4, 6, 8, 16, 32; nilai lain dipetakan ke terdekat)
  --negative         negative prompt (18+-steer, mis. "watermark, nsfw")
  --guidance         guidance scale 1-30 (default engine: 7)
  --seed             seed integer (default: acak tiap generasi)
  --out              folder simpan hasil (default ./hasil-generate)
  --report           path laporan JSON (default <out>/report-<waktu>.json)
  --attempts         jumlah percobaan ulang bila gagal (default 3)
  --generate-timeout ms menunggu hasil generate (default 300000 = 5 menit)
  --light            blok font/media/gambar aset dekoratif untuk hemat memori
  --json             tampilkan JSON report di stdout
  --no-json          jangan tampilkan JSON di stdout (default: tampil)
  Env: SCRAPER_CHROME=/path/chromium | SCRAPER_UA="..." | SCRAPER_STATE=/path/state.json | SCRAPER_NO_KILL=1 | SCRAPER_FRESH=1 (buang cache userKey/cf) | SCRAPER_SKIP_MINT=1 (lewati mint verifikasi)`);
    return;
  }

  const opts = {
    prompt: String(args.prompt != null && args.prompt !== true ? args.prompt : (args._.join(' ') || '')),
    style: typeof args.style === 'string' ? args.style : undefined,
    shape: typeof args.shape === 'string' ? args.shape : (typeof args.resolution === 'string' ? args.resolution : undefined),
    count: typeof args.count === 'string' ? args.count : (typeof args.n === 'string' ? args.n : '4'),
    negative: typeof args.negative === 'string' ? args.negative : undefined,
    guidance: typeof args.guidance === 'string' ? args.guidance : undefined,
    seed: typeof args.seed === 'string' ? args.seed : undefined,
    out: typeof args.out === 'string' ? args.out : path.join(process.cwd(), 'hasil-generate'),
    report: typeof args.report === 'string' ? args.report : undefined,
    attempts: Math.max(1, intOr(args.attempts, 3)),
    genTimeout: Math.max(60000, intOr(args['generate-timeout'] || args.generateTimeout, 300000)),
    light: !!args.light,
  };
  if (!opts.prompt) { console.error('ERROR: prompt wajib. Contoh: node scrape-txt2img.js --prompt "a cat in space" --count 2'); process.exit(1); }
  fs.mkdirSync(opts.out, { recursive: true });

  const started = Date.now();
  let runs = 0;
  let success = null;
  const problems = [];
  const authTracker = { reason: null, status: null, fails: 0 };
  while (runs < opts.attempts && !success) {
    runs++;
    logLine('attempt ' + runs + '/' + opts.attempts);
    try {
      const res = await runGenerationOnce(opts, authTracker);
      if (res.results.length) { success = res; break; }
      let msg = 'attempt ' + runs + ': tidak ada gambar diperoleh' + (res.errorLines.length ? ' | ' + res.errorLines.join(' ; ') : '');
      if (res.authBlocked) msg += ' | verifikasi: ' + (res.lastVerify.reason || 'token_required') + ' (Turnstile tidak memberikan token di environment ini)';
      problems.push(msg);
      logLine(problems[problems.length - 1]);
    } catch (e) {
      problems.push('attempt ' + runs + ': ' + compactText(e && e.message ? e.message : e, 300));
      logLine('attempt gagal:', compactText(e && e.message ? e.message : e, 220));
    }
    await wait(4000);
  }

  const images = [];
  if (success) {
    let i = 1;
    for (const r of success.results) {
      try {
        const m = /^data:image\/([a-z0-9.+-]+);base64,(.+)$/i.exec(r.dataUrl || '');
        if (!m) continue;
        const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
        const buf = Buffer.from(m[2], 'base64');
        const info = imageInfo(buf);
        const file = path.join(opts.out, ts() + '-' + String(i).padStart(2, '0') + '.' + ext);
        fs.writeFileSync(file, buf);
        images.push({ file, format: info.format, width: info.width, height: info.height, bytes: buf.length, seed: r.seed != null ? r.seed : null });
        logLine('disimpan:', file, info.format, (info.width && info.height) ? info.width + 'x' + info.height : '?', humanBytes(buf.length));
        i++;
      } catch (e) { problems.push('simpan gambar gagal: ' + compactText(e.message, 140)); }
    }
  }

  const styleR = success ? success.wanted.style : resolveStyle(opts, FALLBACK_META);
  const shapeR = success ? success.wanted.shape : resolveShape({ shape: opts.shape || 'Square' }, FALLBACK_META);
  const countR = success ? success.wanted.count : resolveCount(opts, FALLBACK_META);
  const ok = !!success && images.length > 0;

  const report = {
    status: { success: ok, failure: ok ? '' : problems[problems.length - 1] || 'unknown' },
    prompt: opts.prompt,
    negativePrompt: opts.negative || '',
    artStyle: { requested: styleR.requested, applied: styleR.applied, exact: styleR.exact },
    shape: { requested: shapeR ? shapeR.requested : (opts.shape || null), appliedResolution: shapeR ? shapeR.value : null, uiLabel: shapeR ? shapeR.uiShape : (shapeR ? null : null) },
    jumlahGambar: { diminta: countR.want, hasil: images.length, tersediaDariGenerator: countR.avail },
    hasilGenerate: images.map((im) => ({ file: im.file, format: im.format, dimensi: (im.width && im.height) ? (im.width + 'x' + im.height) : null, ukuran: humanBytes(im.bytes), seed: im.seed })),
    parameterGenerasi: {
      resolusiEngine: shapeR ? shapeR.value : null,
      guidanceScale: opts.guidance ? intOr(opts.guidance, 7) : (success ? success.meta.defaultGuidanceScale : 7),
      seed: opts.seed != null ? intOr(opts.seed, -1) : -1,
      negativePromptDidukung: true,
      antiDescriptionFieldTerbacaDariUI: success ? success.meta.antiFieldDetected : null,
      engine: (success ? success.meta.engine : FALLBACK_META.engine),
      numImagesOptions: countR.avail,
      artStyleOptions: success ? success.meta.artStyles : FALLBACK_META.artStyles,
    },
    engineInfo: {
      generator: GEN_URL,
      metode: 'chromium-driven UI (browser asli, cf_clearance cache, inline command tokens (negativePrompt/guidanceScale/resolution/seed))',
      apiEndpoints: [SERVER_ORIGIN + '/api/generate', SERVER_ORIGIN + '/api/verifyUser', SERVER_ORIGIN + '/api/checkUserVerificationStatus', SERVER_ORIGIN + '/api/downloadTemporaryImage', SERVER_ORIGIN + '/api/getUserQueuePosition', SERVER_ORIGIN + '/api/createTicket', SERVER_ORIGIN + '/api/saveImageToGallery'],
      hasilDikirimSebagai: 'postMessage {type:"finished", dataUrl, seedUsed} (plus fallback <img>/network)',
    },
    proses: { attempts: runs, problems: problems, cfClearanceState: stateFile, note: 'cfc cache di-purge otomatis bila umur > ' + STATE_MAX_AGE_MIN + ' menit' },
    authVerifikasi: authTracker.reason ? authTracker : undefined,
    networkLog: success ? success.endpoints.slice(-60) : [],
    durationMs: Date.now() - started,
    generatedAt: new Date().toISOString(),
  };

  const reportPath = opts.report || path.join(opts.out, 'report-' + ts() + '.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  if (!ok && authTracker.reason) problems.push('verifikasi: ' + authTracker.status + ' (' + authTracker.reason + ') — Turnstile tidak memberikan token di environment/jaringan ini; coba IP lain / mode visible (Termux non-headless) / profil baru');
  printResult(report);
  console.log('\nJSON report: ' + reportPath);
  if (!args['no-json'] && !ok) console.log(JSON.stringify(report, null, 2));
  else if (!args['no-json']) {
    console.log('\nJSON ringkas:');
    console.log(JSON.stringify({ ...report, parameterGenerasi: { ...report.parameterGenerasi, artStyleOptions: (report.parameterGenerasi.artStyleOptions.length + ' styles tersedia') }, networkLog: report.networkLog.length + ' entri' }, null, 2));
  }
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => { console.error('FATAL:', e && e.message ? e.message : e); process.exit(1); });