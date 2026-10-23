#!/usr/bin/env node

/**
 * Name : Tiktok Search
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://www.tiktok.com
 * Type : Scraper
 * Description : Mencari video tiktok lewat query/pencarian
 * Note : Lengkap untuk data json yang didapat dari Author/Username Creator, author url/tautan profil, Creator Time/Tanggal publikasi, Tittle/deskripsi/caption, Play Count/Jumlah penayangan, Like Count/jumlah like, Comment Count/jumlah komen, Share Count/Jumlah dibagikan, Duration/durasi video, Musik/informasi musik (jika tersedia), hashtags/hastag yg digunakan, Video url/Tautan video, Cover/Thumbnail,Video ID/ID unik video, Btw error fix sendiri
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const SEARCH_API_PATTERNS = [
  '/api/search/general/full/',
  '/api/search/item/full/',
  '/api/search/item/detail/',
];

const DIGIT_RE = /^[0-9]+$/;

function parseArgs(argv) {
  const args = { query: [], limit: 12, pages: 5, out: null, json: false, showBrowser: false, timeout: 120 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--limit': args.limit = Math.max(1, parseInt(argv[++i], 10) || 12); break;
      case '--pages': args.pages = Math.max(1, parseInt(argv[++i], 10) || 5); break;
      case '--timeout': args.timeout = Math.max(20, parseInt(argv[++i], 10) || 120); break;
      case '--out': args.out = argv[++i]; break;
      case '--json': args.json = true; break;
      case '--show-browser': args.showBrowser = true; break;
      case '--help': case '-h': args.help = true; break;
      default:
        if (a.startsWith('--')) { console.error(`Flag tidak dikenal: ${a} (diabaikan)`); }
        else args.query.push(a);
    }
  }
  return args;
}

function printHelp() {
  console.log(`TikTok Search Scraper

Usage:
  node scrape-tiktoksearch.js <query> [options]

Options:
  --limit N      Jumlah video maksimum (default 12)
  --pages N      Maksimum halaman/scroll (default 5)
  --timeout S    Timeout total dalam detik (default 120)
  --out FILE     Simpan JSON ke file tertentu (default: results/tiktok_<slug>.json)
  --json         Cetak JSON ke stdout setelah hasil tersimpan
  --show-browser Jalankan browser non-headless`);
}

/**
 * Temukan executable Chromium/Chrome (semua kandidat yang bisa dieksekusi).
 * Urutan: CHROME_PATH env -> cache ms-playwright -> system paths -> Termux.
 */
function resolveChromiunCandidates() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);

  const home = process.env.HOME || '';
  try {
    const dir = path.join(home, '.cache', 'ms-playwright');
    const versions = fs.readdirSync(dir).filter(d => d.startsWith('chromium-')).sort().reverse();
    for (const v of versions) {
      const sub = fs.readdirSync(path.join(dir, v));
      const folder = sub.find(s => s.startsWith('chrome-linux'));
      if (folder) {
        for (const bin of ['chrome']) candidates.push(path.join(dir, v, folder, bin));
      }
    }
  } catch (_) { /* no playwright cache */ }

  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable', '/usr/bin/chrome', '/snap/bin/chromium', '/usr/bin/headless_shell']) {
    candidates.push(p);
  }
  const prefix = process.env.PREFIX;
  if (prefix) {
    for (const p of [`${prefix}/bin/chromium-browser`, `${prefix}/bin/chromium`, `${prefix}/bin/google-chrome`]) {
      candidates.push(p);
    }
  }
  const ok = [];
  for (const exe of [...new Set(candidates)]) {
    try {
      fs.accessSync(exe, fs.constants.X_OK);
      ok.push(exe);
    } catch (_) { /* next */ }
  }
  return ok;
}

async function launchBrowser(showBrowser) {
  const candidates = resolveChromiunCandidates();
  const opts = {
    headless: !showBrowser,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--disable-dev-shm-usage',
    ],
  };
  let lastErr = null;
  for (const exe of candidates) {
    try {
      return await chromium.launch({ ...opts, executablePath: exe });
    } catch (e) {
      lastErr = e;
      if (!String(e.message || e).includes('Target page, context or browser has been closed')) throw e;
    }
  }
  return chromium.launch(opts);
}

function extractHashtags(item) {
  const tags = [];
  if (Array.isArray(item.textExtra)) {
    for (const t of item.textExtra) {
      if (t && t.hashtagName && (!t.type || t.type === 1)) tags.push(t.hashtagName);
    }
  }
  if (tags.length === 0 && typeof item.desc === 'string') {
    const m = item.desc.match(/#([\p{L}\p{N}_]+)/gu) || [];
    for (const h of m) tags.push(h.slice(1));
  }
  if (tags.length === 0 && Array.isArray(item.challenges)) {
    for (const c of item.challenges) if (c && c.title) tags.push(c.title);
  }
  return [...new Set(tags)];
}

function num(v) {
  if (DIGIT_RE.test(String(v))) return Number(v);
  if (typeof v === 'number') return v;
  return 0;
}

function fmtNum(prefix, ...vals) {
  for (const v of vals) {
    const n = num(v);
    if (n > 0) return n;
  }
  return 0;
}

function mapItem(entry) {
  const it = entry.item || entry;
  if (!it || (!it.id && !(it.video && it.video.id))) return null;
  const author = it.author || {};
  const video = it.video || {};
  const stats = it.stats || {};
  const statsV2 = it.statsV2 || {};
  const music = it.music || {};
  const authorUrl = author.uniqueId ? `https://www.tiktok.com/@${author.uniqueId}` : '';
  const musicSlug = (music.title || '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
  const musicUrl = music.id ? `https://www.tiktok.com/music/${musicSlug ? musicSlug + '-' : ''}${music.id}` : '';
  const hashtags = extractHashtags(it);
  const createTime = it.createTime ? new Date(num(it.createTime) * 1000) : null;

  return {
    video_id: it.id || video.id || '',
    title: it.desc || '',
    video_url: `https://www.tiktok.com/@${author.uniqueId || '_'}/video/${it.id || video.id}`,
    author: author.uniqueId || '',
    author_url: authorUrl,
    cover: video.cover || '',
    play_count: fmtNum('', statsV2.playCount, stats.playCount),
    like_count: fmtNum('', statsV2.diggCount, stats.diggCount),
    comment_count: fmtNum('', statsV2.commentCount, stats.commentCount),
    share_count: fmtNum('', statsV2.shareCount, stats.shareCount),
    creator_time: createTime ? createTime.toISOString() : null,
    duration: num(video.duration),
    music: music.title || music.authorName
      ? { title: music.title || '', author: music.authorName || '', url: musicUrl }
      : null,
    hashtags,
  };
}

function parseResponses(responses, keyword) {
  const seen = new Set();
  let hasMore = false;
  const out = [];
  for (const r of responses) {
    if (r.keyword && r.keyword.toLowerCase() !== keyword.toLowerCase()) continue;
    if (!r.json || !Array.isArray(r.json.data)) continue;
    if (Array.isArray(r.json.data)) {
      for (const entry of r.json.data) {
        if (entry && entry.isAd) continue;
        const mapped = mapItem(entry);
        if (!mapped || !mapped.video_id || seen.has(mapped.video_id)) continue;
        seen.add(mapped.video_id);
        out.push(mapped);
      }
    }
    if (r.json.has_more === true) hasMore = true;
  }
  return { items: out, hasMore };
}

async function scrollPage(page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    const els = Array.from(document.querySelectorAll('*')).filter(el =>
      el.scrollHeight > el.clientHeight + 50 && el.clientHeight > 200);
    els.forEach(el => { el.scrollBy(0, 2200); el.scrollTop = el.scrollHeight; });
  }).catch(() => { });
  await page.mouse.move(720, 450).catch(() => { });
  await page.mouse.wheel(0, 1600).catch(() => { });
}

async function runOnce(browser, args, query, log) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'Asia/Jakarta',
  });

  const responses = [];
  let page;
  let blocked = false;
  try {
    page = await context.newPage();
    page.on('response', async (res) => {
      try {
        const url = res.url();
        if (!SEARCH_API_PATTERNS.some(p => url.includes(p))) return;
        let keyword = '';
        const kwMatch = url.match(/[?&]keyword=([^&]*)/);
        if (kwMatch) keyword = decodeURIComponent(kwMatch[1]);
        const json = await res.json().catch(() => null);
        const status = res.status();
        if (json) responses.push({ url, status, keyword, json, at: Date.now() });
      } catch (_) { /* ignore */ }
    });

    try {
      await page.goto(`https://www.tiktok.com/search?q=${encodeURIComponent(query)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
    } catch (e) {
      log(`goto error: ${String(e.message || e).slice(0, 160)}`);
    }

    const title = (await page.title().catch(() => '')) || '';
    if (/verify|captcha|captchachallenge/i.test(title)) blocked = true;

    // Hydrasi hasil search TikTok bervariasi 6-25 detik; poll sampai API merespons.
    const startWait = Date.now();
    while (Date.now() - startWait < args.timeout * 1000) {
      const parsed = parseResponses(responses, query);
      if (parsed.items.length > 0) {
        log(`Data awal diterima: ${parsed.items.length} video (${((Date.now() - startWait) / 1000).toFixed(0)}s)`);
        await page.waitForTimeout(1500);
        break;
      }
      await page.waitForTimeout(2000);
      if (Date.now() - startWait > 6000) {
        await scrollPage(page);
        log(`Menunggu data API search... (${((Date.now() - startWait) / 1000).toFixed(0)}s)`);
      }
    }

    // Pagination: scroll ke bawah untuk memuat halaman berikutnya.
    let idleRounds = 0;
    for (let i = 0; i < args.pages; i++) {
      const beforeItems = parseResponses(responses, query).items.length;
      if (beforeItems >= args.limit) break;
      await scrollPage(page);
      await page.waitForTimeout(3500);
      const after = parseResponses(responses, query).items.length;
      log(`Scroll hal ${i + 1}: items ${beforeItems} -> ${after}`);
      if (after === beforeItems) {
        idleRounds++;
        if (idleRounds >= 2) { log('Tidak ada item baru, berhenti scroll.'); break; }
      } else {
        idleRounds = 0;
      }
    }
  } catch (e) {
    log(`runOnce error: ${String(e.message || e).slice(0, 160)}`);
  } finally {
    try { if (page) { await page.close(); } } catch (_) { /* ignore */ }
    try { await context.close(); } catch (_) { /* ignore */ }
  }

  return { responses, blocked };
}

function printHuman(results) {
  const sep = '-'.repeat(60);
  results.forEach((v, i) => {
    const t = v.creator_time ? new Date(v.creator_time) : null;
    console.log(`\n#${i + 1} ${sep}`);
    console.log(`Author/Username Creator: ${v.author ? '@' + v.author : '-'}`);
    console.log(`author url/tautan profil: ${v.author_url || '-'}`);
    console.log(`Creator Time/Tanggal publikasi: ${t ? t.toISOString() : '-'}`);
    console.log(`Tittle/deskripsi/caption: ${v.title || '-'}`);
    console.log(`Play Count/Jumlah penayangan: ${v.play_count}`);
    console.log(`Like Count/jumlah like: ${v.like_count}`);
    console.log(`Comment Count/jumlah komen: ${v.comment_count}`);
    console.log(`Share Count/Jumlah dibagikan: ${v.share_count}`);
    console.log(`Duration/durasi video: ${v.duration ? v.duration + ' detik' : '-'}`);
    console.log(`Musik/informasi musik (jika tersedia): ${v.music ? `${v.music.title} — ${v.music.author}` : '-'}${v.music && v.music.url ? ` (${v.music.url})` : ''}`);
    console.log(`hashtags/hastag yg digunakan: ${v.hashtags.length ? v.hashtags.map(h => '#' + h).join(' ') : '-'}`);
    console.log(`Video url/Tautan video: ${v.video_url}`);
    console.log('');
    console.log(`Cover/Thumbnail: ${v.cover || '-'}`);
    console.log(`Video ID/ID unik video: ${v.video_id}`);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.query.length === 0) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }
  const query = args.query.join(' ').trim();
  if (!query) {
    console.error('Query kosong. Contoh: node scrape-tiktoksearch.js "kucing lucu" --limit 12');
    process.exit(1);
  }

  const log = (m) => { if (!args.json) console.error('[info]', m); };

  let browser;
  const started = Date.now();
  try {
    browser = await launchBrowser(args.showBrowser);
  } catch (e) {
    const msg = String(e.message || e);
    console.error('[error] Gagal menjalankan browser Chromium/Chrome.');
    console.error('[error] Detail:', msg.split('\n')[0].slice(0, 300));
    console.error('[error] Solusi:');
    console.error('        1) Termux:   pkg install chromium  lalu jalankan:  CHROME_PATH=$PREFIX/bin/chromium-browser node scrape-tiktoksearch.js "<query>"');
    console.error('        2) Ubuntu:   sudo apt install chromium-browser');
    console.error('        3) Windows:  sertakan path chrome.exe, mis:  CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node scrape-tiktoksearch.js "<query>"');
    console.error('        4) Atau install browser Playwright: npx playwright install chromium');
    process.exit(1);
  }

  log(`Browser: ${browser.version() || 'chromium'}`);

  const tries = [1, 2];
  let scanned = { responses: [], blocked: false };
  try {
    for (const t of tries) {
      scanned = await runOnce(browser, args, query, log);
      const parsed = parseResponses(scanned.responses, query);
      log(`Percobaan ${t}: respon API=${scanned.responses.length}, video unik=${parsed.items.length}${scanned.blocked ? ' (terdeteksi halaman verifikasi)' : ''}`);
      if (parsed.items.length > 0) break;
      if (scanned.blocked) { log('Halaman verifikasi muncul, mencoba ulang...'); await new Promise(s => setTimeout(s, 5000)); }
      else await new Promise(s => setTimeout(s, 3000));
    }
  } finally {
    try { await browser.close(); } catch (_) { /* ignore */ }
  }

  const { items, hasMore } = parseResponses(scanned.responses, query);
  if (items.length === 0) {
    console.error('[error] Tidak ada data yang berhasil diambil.');
    console.error('[error] Kemungkinan: koneksi lambat, IP diblokir/batas rate TikTok, atau query tanpa hasil. Coba lagi, ganti query, atau naikkan --timeout.');
    process.exit(1);
  }
  if (items.length < args.limit) {
    log(`Mendapat ${items.length} dari target ${args.limit}${hasMore ? '' : ' (tidak ada halaman lagi)'}`);
  }

  const results = items.slice(0, args.limit);
  const payload = {
    query,
    source: `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`,
    scraped_at: new Date().toISOString(),
    count: results.length,
    results,
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    printHuman(results);
  }

  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'search';
  const outPath = args.out || path.join('results', `tiktok_${slug}.json`);
  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
    console.error(`[ok] Total ${results.length} video. JSON tersimpan di: ${outPath} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  } catch (e) {
    console.error('[warn] Gagal menyimpan file JSON:', String(e.message || e).slice(0, 120));
  }
}

main();
