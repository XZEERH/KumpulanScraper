#!/usr/bin/env node

/**
 * Name : Dramabox
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/apps : "https://play.google.com/store/apps/details?id=com.storymatrix.drama", " https://www.dramaboxapp.com"
 * Type : Scraper
 * Description : DramaBox streaming drama pendek
Note : Data yang diambil lengkap banget (kayaknya) dari drama_id, title, cover_url, thumbnail_url, description, genre, category, tags, country, language, subtitle_languages, dubbing_languages, release_date, update_date, drama_status, total_episodes, episode_id, episode_number, episode_title, episode_duration, episode_access (free), trailer_url, rating, popularity, feed_section (Untukmu/Terbaru/Daftar Peringkat/Kategori), section_id, section_name, display_position, drama_badge (Terpopuler/Terbaru), view_count, ranking_position, recommendation_status, category_id, category_name, video_id, episode_id, playback_type, stream_format (HLS/DASH), video_resolution, video_codec, audio_codec, video_duration, video_bitrate, frame_rate, audio_tracks, subtitle_tracks, subtitle_url, thumbnail_url, preview_url, drm_protection, playback_status. Harusnya sih udah lengkap ya, btw error fix sendiri
 */

'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');

const pkg = require('./package.json');

/* ================== KONFIG ================== */

const RETRIES = parseInt(process.env.RETRIES, 10) || 6;
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS, 10) || 25000;
const CONCURRENCY = parseInt(process.env.CONCURRENCY, 10) || 5;
const DELAY_MS = parseInt(process.env.DELAY_MS, 10) || 150;

const APP_W = 'https://www.dramaboxapp.com';
const APPID_PLAY = 'com.storymatrix.drama';
const PLAY_URL = `https://play.google.com/store/apps/details?id=${APPID_PLAY}&hl=en`;

const LOCALES = ['en', 'zhHans', 'ko', 'zh', 'es', 'in', 'ja', 'de', 'fr', 'pt', 'ar', 'th', 'tl', 'vi', 'it', 'tr', 'pl'];

const FEED_POSITIONS = ['top-hits', 'must-sees', 'trending', 'hidden-gems'];

const ZH_SECTION_LABEL = {
  热门好剧: 'Daftar Peringkat',
  必看好剧: 'Drama Wajib Tonton (Terbaru)',
  当前热播: 'Sedang Tren',
  精彩剧集: 'Drama Menarik (Terbaru)',
};

const UAS = [
  'Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nn = (v) => (v === undefined || v === null || v === '' ? null : v);
const num = (v) => {
  if (typeof v === 'number') return v;
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

/* ================== HTTP: RETRY + ROTASI UA + BACKOFF ================== */

let uaIdx = Math.floor(Math.random() * UAS.length);
function nextUA() {
  uaIdx = (uaIdx + 1) % UAS.length;
  return UAS[uaIdx];
}

const stats = { requests: 0, retries: 0, ok: 0, fail: 0 };

async function request(url, opts = {}) {
  const maxAttempts = opts.retries != null ? opts.retries : RETRIES;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      stats.requests += 1;
      const res = await axios({
        method: opts.method || 'GET',
        url,
        timeout: opts.timeout || TIMEOUT_MS,
        headers: Object.assign(
          {
            'User-Agent': nextUA(),
            Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.8,id;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            Referer: 'https://www.dramaboxapp.com/',
            Connection: 'keep-alive',
          },
          opts.headers || {}
        ),
        responseType: 'text',
        maxContentLength: opts.maxContentLength || 12 * 1024 * 1024,
        validateStatus: null,
      });

      if (res.status >= 200 && res.status < 300) {
        if (typeof res.data !== 'string' || res.data.length === 0) throw new Error('EMPTY_BODY');
        stats.ok += 1;
        return res.data;
      }

      const err = new Error(`HTTP_${res.status} ${url}`);
      err.permanent = res.status === 404 || res.status === 410;
      err.status = res.status;
      throw err;
    } catch (e) {
      lastErr = e;
      if (e.permanent || attempt === maxAttempts) break;
      stats.retries += 1;
      const base = e.status === 403 || e.status === 429 ? 3000 : Math.min(500 * Math.pow(2, attempt - 1), 9000);
      await sleep(base + Math.floor(Math.random() * 700));
      if (opts.onRetry) opts.onRetry(attempt, e);
    }
  }

  stats.fail += 1;
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/* paralel terbatas (pengganti p-limit) */
async function pool(items, worker, limit = CONCURRENCY) {
  const out = new Array(items.length);
  let cur = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cur < items.length) {
        const i = cur++;
        try {
          out[i] = await worker(items[i], i);
        } catch (e) {
          out[i] = { error: (e && e.message) || String(e), for_id: items[i] && items[i].id };
        }
      }
    })
  );
  return out;
}

/* ================== PARSER __NEXT_DATA__ ================== */

function extractNextData(html, label) {
  if (!html || typeof html !== 'string') throw new Error(`BODY KOSONG: ${label}`);
  try {
    const $ = cheerio.load(html);
    const el = $('#__NEXT_DATA__');
    if (el.length) {
      const txt = el.eq(0).text();
      if (txt) return JSON.parse(txt);
    }
  } catch (e) {
    if (/NEXT_DATA|cheerio CPU/.test(e.message)) throw e;
  }
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (m) {
    try {
      return JSON.parse(m[1]);
    } catch (e2) {}
  }
  throw new Error(`NEXT_DATA_TIDAK_DITEMUKAN: ${label}`);
}

/* ================== HELPER ================== */

function baseOf(locale) {
  return locale && locale !== 'en' ? `${APP_W}/${locale}` : APP_W;
}

function stripCover(cover) {
  if (!cover || typeof cover !== 'string') return null;
  return cover.split('@')[0];
}

const LANG_MAP = {
  english: 'en',
  en: 'en',
  chinese: 'zh',
  zh: 'zh',
  korean: 'ko',
  japanese: 'ja',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  portuguese: 'pt',
  indonesian: 'in',
  arabic: 'ar',
  thai: 'th',
  vietnamese: 'vi',
  italian: 'it',
  turkish: 'tr',
  polish: 'pl',
  tagalog: 'tl',
};

function langLabel(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  return LANG_MAP[s] || (s.length <= 5 ? s : null);
}

const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 百: 100, 千: 1000 };

function cnNumToArabic(cn) {
  const s = String(cn).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  let total = 0, cur = 0;
  for (const ch of s) {
    const v = CN_NUM[ch];
    if (!v) return null;
    if (v === 10 || v === 100 || v === 1000) {
      total += (cur || 1) * v;
      cur = 0;
    } else cur = v;
  }
  return total + cur;
}

/* 第X集 -> "Episode X" (judul asli tetap disimpan) */
function localizedEpisodeTitle(name) {
  if (!name) return { title: null, original: null };
  const m = String(name).match(/^第([\d一二三四五六七八九十百]+)集$/);
  if (m) {
    const n = cnNumToArabic(m[1]);
    if (n) return { title: `Episode ${n}`, original: name };
  }
  return { title: String(name), original: String(name) };
}

function statusLabel(item) {
  if (!item) return null;
  if (typeof item.status === 'string') {
    if (/complet/i.test(item.status)) return 'Completed';
    if (/ongo/i.test(item.status)) return 'Ongoing';
    return item.status;
  }
  if (item.lastUpdateTimeDisplay) {
    if (/complet/i.test(item.lastUpdateTimeDisplay)) return 'Completed';
    if (/ongo/i.test(item.lastUpdateTimeDisplay)) return 'Ongoing';
  }
  return null;
}

function dateOf(item) {
  return item.firstShelfTime || item.shelfTime || null;
}

function isNewRelease(item) {
  const d = dateOf(item);
  if (!d) return false;
  const t = new Date(String(d).replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 30 * 86400 * 1000;
}

function zhDictOf(props, locale) {
  const out = {};
  try {
    const common =
      props._nextI18Next &&
      props._nextI18Next.initialI18nStore &&
      props._nextI18Next.initialI18nStore[locale] &&
      props._nextI18Next.initialI18nStore[locale].common;
    if (common) for (const [k, v] of Object.entries(common)) if (/[\u4e00-\u9fff]/.test(k)) out[k] = v;
  } catch (e) {}
  return out;
}

/* ================== KARTU DRAMA ================== */

function emptyCard(bookId) {
  return {
    drama_id: String(bookId),
    title: null,
    cover_url: null,
    thumbnail_url: null,
    description: null,
    genre: [],
    category: null,
    category_id: null,
    category_name: null,
    tags: [],
    country: null,
    language: null,
    subtitle_languages: [],
    dubbing_languages: [],
    release_date: null,
    update_date: null,
    drama_status: null,
    total_episodes: null,
    rating: null,
    popularity: null,
    view_count: null,
    view_count_display: null,
    follow_count: null,
    author: null,
    type_one: null,
    aliases: [],
    protagonist: null,
    drama_badge: [],
    web_url: null,
    placements: [],
    recommendation_status: null,
    feed: null,
    categories_detail: null,
    ui_languages: null,
    recommends: null,
    episodes: null,
  };
}

function recStatusOf(feedSection) {
  switch (feedSection) {
    case 'Untukmu':
      return 'FOR_YOU_RECOMMENDED';
    case 'Daftar Peringkat':
      return 'RANKED';
    case 'Terbaru':
      return 'NEW_LISTED';
    case 'Kategori':
      return 'CATEGORY_BROWSE';
    case 'Pencarian':
      return 'SEARCH_RESULT';
    case 'Detail':
      return 'DIRECT_DETAIL';
    default:
      return null;
  }
}

function cardFromItem(item, feed) {
  const bookId = String(item.bookId || item.action || item.originalBookId || '');
  if (!/^\d+$/.test(bookId)) return null;

  const view = num(item.viewCount);
  const follow = num(item.followCount);
  const genre = Array.isArray(item.typeTwoNames) ? item.typeTwoNames : item.typeTwoName ? [item.typeTwoName] : [];

  const placement = {
    feed_section: feed.feed_section,
    section_id: nn(feed.section_id),
    section_name: feed.section_name,
    section_position: nn(feed.section_position),
    display_position: nn(feed.display_position),
    ranking_position: nn(feed.ranking_position),
    category_id: nn(feed.category_id),
    category_name: nn(feed.category_name),
  };

  const badges = [];
  if (item.lastUpdateTimeDisplay && !/complet/i.test(String(item.lastUpdateTimeDisplay))) badges.push('Terbaru');
  if (feed.ranking_position != null && feed.ranking_position <= 3) if (!badges.includes('Terpopuler')) badges.push('Terpopuler');

  const card = emptyCard(bookId);
  card.title = item.bookName || item.name || null;
  card.cover_url = stripCover(item.cover || item.coverWap);
  card.thumbnail_url = item.cover || item.coverWap || null;
  card.description = item.introduction || null;
  card.genre = genre;
  card.category = item.typeTwoName || genre[0] || null;
  card.category_id = nn(feed.category_id);
  card.category_name = nn(feed.category_name);
  card.tags = Array.isArray(item.tags) ? item.tags : Array.isArray(item.labels) ? item.labels : [];
  card.country = null;
  card.language = langLabel(item.language) || langLabel(item.simpleLanguage);
  card.subtitle_languages = [];
  card.dubbing_languages = [];
  card.release_date = dateOf(item);
  card.update_date = item.shelfTime || null;
  card.drama_status = statusLabel(item);
  card.total_episodes = num(item.chapterCount);
  card.rating = num(item.ratings);
  card.view_count = num(item.viewCount);
  card.popularity = view != null ? view : follow;
  card.view_count_display = item.viewCountDisplay || null;
  card.drama_badge = badges;
  card.recommendation_status = recStatusOf(feed.feed_section);
  card.follow_count = follow;
  card.author = item.author || null;
  card.type_one = item.typeOneName || (Array.isArray(item.typeOneNames) ? item.typeOneNames[0] : null);
  card.aliases = item.alias ? [item.alias] : [];
  card.protagonist = item.protagonist || null;
  card.web_url = `${baseOf(feed.locale)}/film/${bookId}`;
  card.placements = [placement];
  card.feed = placement;
  return card;
}

class DramaBook {
  constructor() {
    this.map = new Map();
    this.order = [];
  }

  add(item, feed) {
    const card = cardFromItem(item, feed);
    if (!card) return false;
    const prev = this.map.get(card.drama_id);
    if (prev) {
      const pa = JSON.stringify(prev.placements[0]);
      const pb = JSON.stringify(card.placements[0]);
      if (pa !== pb) prev.placements.push(card.placements[0]);
      if (prev.rating == null && card.rating != null) prev.rating = card.rating;
      if (prev.view_count == null && card.view_count != null) prev.view_count = card.view_count;
      if (prev.popularity == null && card.popularity != null) prev.popularity = card.popularity;
      for (const b of card.drama_badge) if (!prev.drama_badge.includes(b)) prev.drama_badge.push(b);
      return false;
    }
    this.map.set(card.drama_id, card);
    this.order.push(card.drama_id);
    return true;
  }

  list() {
    return this.order.map((id) => this.map.get(id));
  }
}

function i18nLabel(props, locale, zhOrFallback) {
  const dict = zhDictOf(props, locale);
  if (dict[zhOrFallback]) return dict[zhOrFallback];
  return zhOrFallback;
}

/* ================== BERANDA (feed "Untukmu") ================== */

async function scrapeHomepage(locale, book) {
  const html = await request(`${baseOf(locale)}/`);
  const props = extractNextData(html, 'dom').props.pageProps;
  const sections = [];

  (props.bigList || []).forEach((item, i) => {
    book.add(item, {
      locale,
      feed_section: 'Untukmu',
      section_id: 'bigList',
      section_name: i18nLabel(props, locale, '热门好剧'),
      section_position: 'homepage-banner',
      display_position: i + 1,
    });
  });
  sections.push({
    feed_section: 'Untukmu',
    section_id: 'bigList',
    section_name: i18nLabel(props, locale, '热门好剧'),
    position: 'homepage-banner',
    total_items: (props.bigList || []).length,
  });

  (props.smallData || []).forEach((section) => {
    const name = i18nLabel(props, locale, section.name);
    (section.items || []).forEach((item, i) => {
      book.add(item, {
        locale,
        feed_section: 'Untukmu',
        section_id: section.id,
        section_name: name,
        section_position: 'homepage',
        display_position: i + 1,
      });
    });
    sections.push({
      feed_section: 'Untukmu',
      section_id: section.id,
      section_name: name,
      position: 'homepage',
      total_items: (section.items || []).length,
    });
  });

  return { sections, props };
}

/* ================== SEKSI FEED /more/[position](/[page]) ================== */

async function scrapeMoreSection(position, locale, book, maxPages, sectionOut, sectionSeen) {
  const props = extractNextData(await request(`${baseOf(locale)}/more/${position}`), `more ${position}`).props.pageProps;
  const sectionName = i18nLabel(props, locale, props.positionName);
  const data = props.moreData || {};
  const feed_section = position === 'top-hits' || position === 'trending' ? 'Daftar Peringkat' : 'Terbaru';
  const seen = sectionSeen.get(position) || new Set();
  sectionSeen.set(position, seen);

  const emit = (items, offset) => {
    items.forEach((item, i) => {
      book.add(item, {
        locale,
        feed_section,
        section_id: data.id != null ? data.id : null,
        section_name: sectionName,
        section_position: position,
        display_position: offset + i + 1,
        ranking_position: position === 'top-hits' || position === 'trending' ? offset + i + 1 : null,
      });
    });
  };
  const freshOf = (items) => {
    const fresh = [];
    for (const item of items) {
      const id = String(item.bookId || item.action || item.originalBookId || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      fresh.push(item);
    }
    return fresh;
  };

  const page1Fresh = freshOf(data.items || []);
  emit(page1Fresh, 0);
  sectionOut.push({
    feed_section,
    section_id: data.id != null ? data.id : null,
    section_name: sectionName,
    position,
    page: 1,
    pages: props.pages || 1,
    total_items: page1Fresh.length,
  });

  let runningOffset = page1Fresh.length;
  const maxPage = Math.min(props.pages || 1, maxPages);
  for (let p = 2; p <= maxPage; p++) {
    await sleep(DELAY_MS);
    let pProps;
    try {
      pProps = extractNextData(await request(`${baseOf(locale)}/more/${position}/${p}`), `more ${position} p${p}`).props.pageProps;
    } catch (e) {
      warnings.push(`more/${position} hal ${p}: ${e.message}`);
      break;
    }
    const fresh = freshOf((pProps.moreData && pProps.moreData.items) || []);
    if (!fresh.length) break;
    emit(fresh, runningOffset);
    runningOffset += fresh.length;
    sectionOut.push({
      feed_section,
      section_id: (pProps.moreData && pProps.moreData.id) != null ? pProps.moreData.id : null,
      section_name: sectionName,
      position,
      page: p,
      pages: pProps.pages || props.pages || 1,
      total_items: fresh.length,
    });
  }
}

/* ================== KATEGORI /browse ================== */

async function categoriesOf(locale) {
  const props = extractNextData(await request(`${baseOf(locale)}/browse`), 'browse index').props.pageProps;
  return (props.types || []).filter((t) => t.id).map((t) => ({ category_id: t.id, category_name: t.name, category_slug: t.replaceName }));
}

function browsePageAdd(props, book, locale, catMeta) {
  const items = props.bookList || [];
  if (!items.length) return 0;
  const catName = i18nLabel(props, locale, props.typeTwoName && props.typeTwoName !== 'all' ? props.typeTwoName : 'Semua Drama');
  const offset = (catMeta && catMeta.offset) || 0;
  items.forEach((item, i) => {
    book.add(item, {
      locale,
      feed_section: 'Kategori',
      section_id: props.typeTwoId != null ? props.typeTwoId : (catMeta && catMeta.catId) || null,
      section_name: catName,
      section_position: catMeta && catMeta.section_position ? catMeta.section_position : props.typeTwoId,
      category_id: props.typeTwoId != null ? props.typeTwoId : (catMeta && catMeta.catId) || null,
      category_name: catName,
      display_position: offset + i + 1,
    });
  });
  return offset + items.length;
}

async function scrapeCategory(locale, book, catId, maxPages, catOut) {
  const props = extractNextData(await request(`${baseOf(locale)}/browse/${catId}`), `browse ${catId}`).props.pageProps;
  const catName = i18nLabel(props, locale, props.typeTwoName && props.typeTwoName !== 'all' ? props.typeTwoName : String(catId));
  let running = browsePageAdd(props, book, locale, { heading: catName, section_position: 'browse', catId, offset: 0 });
  catOut.push({ feed_section: 'Kategori', category_id: props.typeTwoId != null ? props.typeTwoId : catId, category_name: catName, page: 1, pages: props.pages || 0, total_running: running, added_this_page: props.bookList ? props.bookList.length : 0, kosong: (props.bookList || []).length === 0 ? 'tidak ada konten kategori ini pada lokal terpilih' : null });
  if (!running && (!props.bookList || !props.bookList.length)) return props.pages || 0;

  const maxPage = Math.min(props.pages || 1, maxPages);
  for (let p = 2; p <= maxPage; p++) {
    await sleep(DELAY_MS);
    try {
      const pProps = extractNextData(await request(`${baseOf(locale)}/browse/${catId}/${p}`), `browse ${catId} p${p}`).props.pageProps;
      const pageAdded = (pProps.bookList || []).length;
      running = browsePageAdd(pProps, book, locale, { heading: catName, section_position: 'browse', catId, offset: running });
      if (!pageAdded) break;
      catOut.push({ feed_section: 'Kategori', category_id: catId, category_name: catName, page: p, pages: pProps.pages || props.pages || running, total_running: running, added_this_page: pageAdded });
    } catch (e) {
      warnings.push(`browse ${catId} hal ${p}: ${e.message}`);
      break;
    }
  }
  return running;
}

/* ================== PENCARIAN /search ================== */

async function scrapeSearch(query, locale, book, maxPages, searchOut) {
  const q = encodeURIComponent(query);
  const props = extractNextData(await request(`${baseOf(locale)}/search?searchValue=${q}`), 'search').props.pageProps;

  (props.bookList || []).forEach((item, i) => {
    book.add(item, {
      locale,
      feed_section: 'Pencarian',
      section_name: `Pencarian: ${query}`,
      section_position: 'search',
      display_position: i + 1,
    });
  });
  searchOut.push({
    query,
    page: props.pageNo || 1,
    pages: props.totalPage || 1,
    total_num: props.totalNum || null,
    added: (props.bookList || []).length,
    similar: (props.similarList || []).slice(0, 8).map((s) => ({
      drama_id: s.bookId,
      title: s.bookName,
      cover_url: stripCover(s.cover),
      rating: num(s.ratings),
      genre: s.typeTwoNames || [],
      web_url: `${baseOf(locale)}/film/${s.bookId}`,
    })),
  });

  const maxPage = Math.min(props.totalPage || 1, maxPages);
  let runningSearch = (props.bookList || []).length;
  for (let p = 2; p <= maxPage; p++) {
    await sleep(DELAY_MS);
    try {
      const pProps = extractNextData(await request(`${baseOf(locale)}/search/${p}?searchValue=${q}`), `search p${p}`).props.pageProps;
      const items = pProps.bookList || [];
      if (!items.length) break;
      items.forEach((item, i) => {
        book.add(item, {
          locale,
          feed_section: 'Pencarian',
          section_name: `Pencarian: ${query}`,
          section_position: 'search',
          display_position: runningSearch + i + 1,
        });
      });
      runningSearch += items.length;
      searchOut.push({ query, page: p, pages: pProps.totalPage || 1, total_num: pProps.totalNum, added: items.length, running: runningSearch, similar: [] });
    } catch (e) {
      warnings.push(`search hal ${p}: ${e.message}`);
      break;
    }
  }
}

/* ================== DETAIL DRAMA /film/[bookId] ================== */

async function scrapeDetail(bookId, locale, probeCount) {
  const props = extractNextData(await request(`${baseOf(locale)}/film/${bookId}`), `film ${bookId}`).props.pageProps;
  const info = props.bookInfo || {};
  const chapters = props.chapterList || [];

  const detail = {
    drama_id: String(info.bookId || bookId),
    title: info.bookName || null,
    cover_url: stripCover(info.cover),
    thumbnail_url: chapters.length && chapters[0].cover ? stripCover(chapters[0].cover) : stripCover(info.cover),
    description: info.introduction || null,
    genre: info.typeTwoNames || [],
    category: !!(info.typeTwoList && info.typeTwoList[0]) ? info.typeTwoList[0].name : info.typeTwoName || null,
    tags: info.tags || info.labels || [],
    country: null,
    language: langLabel(info.language) || langLabel(info.simpleLanguage),
    subtitle_languages: [],
    dubbing_languages: [],
    release_date: info.firstShelfTime || null,
    update_date: info.shelfTime || null,
    drama_status: statusLabel(info) || (chapters.some((c) => c.new) ? 'Ongoing' : 'Completed'),
    total_episodes: num(info.chapterCount) || chapters.length,
    rating: null,
    popularity: num(info.viewCount),
    view_count: num(info.viewCount),
    view_count_display: null,
    follow_count: num(info.followCount),
    author: info.author || null,
    type_one: info.typeOneName || null,
    aliases: info.alias ? [info.alias] : [],
    protagonist: info.protagonist || null,
    drama_badge: isNewRelease(info) ? ['Terbaru'] : [],
    web_url: `${baseOf(locale)}/film/${String(info.bookId || bookId)}`,
    placements: [],
    recommendation_status: 'DIRECT_DETAIL',
    category_id: !!(info.typeTwoList && info.typeTwoList[0]) ? info.typeTwoList[0].id : null,
    category_name: !!(info.typeTwoList && info.typeTwoList[0]) ? info.typeTwoList[0].name : null,
    feed: null,
    categories_detail: (info.typeTwoList || []).map((c) => ({ category_id: c.id, category_name: c.name, category_slug: c.replaceName })),
    ui_languages: props.languages || [],
    shelf_time: info.shelfTime || null,
    first_shelf_time: info.firstShelfTime || null,
    episode_tabs: props.tabData || [],
    recommends: (props.recommends || []).slice(0, 12).map((r) => ({
      drama_id: r.bookId,
      title: r.bookName,
      cover_url: stripCover(r.cover),
      rating: num(r.ratings),
      genre: r.typeTwoNames || [],
      tags: r.tags || r.labels || [],
      popularity: num(r.viewCount),
      web_url: `${baseOf(locale)}/film/${r.bookId}`,
    })),
    episodes: chapters.map((ch, i) => ({
      episode_id: String(ch.id),
      episode_number: num(ch.index) != null ? num(ch.index) + 1 : i + 1,
      episode_title: localizedEpisodeTitle(ch.name).title,
      episode_title_original: localizedEpisodeTitle(ch.name).original,
      episode_duration: num(ch.duration) != null ? Math.round(ch.duration / 1000) : null,
      episode_duration_ms: num(ch.duration),
      episode_access: ch.unlock === true ? 'FREE' : ch.unlock === false ? 'VIP' : 'UNKNOWN',
      trailer_url: null,
      rating: null,
      popularity: null,
      rank_index: /^0*\d+$/.test(String(ch.indexStr || '')) ? num(ch.indexStr) : null,
      display_position: i + 1,
      update_time: ch.utime || null,
      unit_price: num(ch.chapterPrice),
      is_new: ch.new === true ? true : null,
      video_id: videoIdOf(ch),
      playback_type: ch.m3u8Flag ? 'HLS_STREAM' : ch.mp4 ? 'MP4_DIRECT' : ch.unlock === false ? 'LOCKED' : 'UNKNOWN',
      stream_format: ch.m3u8Url ? 'HLS' : ch.mp4 ? 'MP4' : null,
      video_resolution: resolutionOf(ch),
      video_codec: null,
      audio_codec: null,
      video_duration: num(ch.duration) != null ? Math.round(ch.duration / 1000) : null,
      video_bitrate: null,
      frame_rate: null,
      audio_tracks: [],
      subtitle_tracks: [],
      subtitle_url: null,
      stream_url_hls: ch.m3u8Url || null,
      stream_url_mp4: ch.mp4 || null,
      thumbnail_url: ch.cover ? stripCover(ch.cover) : null,
      preview_url: ch.cover || null,
      drm_protection: false,
      playback_status: ch.mp4 || ch.m3u8Url ? 'AVAILABLE' : ch.unlock === false ? 'LOCKED_VIP' : 'UNKNOWN',
      playback_probe: null,
    })),
  };

  const probeList =
    probeCount && probeCount > 0
      ? chapters.slice(0, probeCount).filter((c) => c.m3u8Url || c.mp4)
      : [];

  return { detail, chapters, probeList };
}

function videoIdOf(ch) {
  const u = ch.mp4 || ch.m3u8Url || '';
  const m = u.match(/\/(\d+_\d)\//);
  if (m) return m[1];
  return nn(ch.id);
}

function resolutionOf(ch) {
  const u = ch.mp4 || ch.m3u8Url || '';
  const m = u.match(/\.(\d{3,4})p/);
  if (m) return `${m[1]}p`;
  return null;
}

/* ============ PROBE HLS (parse .m3u8, tanpa engine berat) ============ */

async function probeHls(chapter) {
  const out = {
    probed: false,
    video_resolution: null,
    video_codec: null,
    audio_codec: null,
    video_bitrate: null,
    frame_rate: null,
    audio_tracks: [],
    subtitle_tracks: [],
    subtitle_url: null,
    video_duration: null,
    drm_protection: false,
    playback_status: 'UNKNOWN',
  };
  const url = chapter.m3u8Url || chapter.mp4;
  if (!url) {
    out.playback_status = 'NO_SOURCE';
    return out;
  }
  try {
    const body = await request(url, {
      headers: {
        'User-Agent': UAS[0],
        Accept: '*/*',
        Referer: 'https://www.dramaboxapp.com/',
      },
      timeout: 15000,
      maxContentLength: 2 * 1024 * 1024,
    });
    out.probed = true;
    out.playback_status = 'PLAYABLE';

    if (body.includes('#EXT-X-STREAM-INF')) {
      const variant = body.match(/#EXT-X-STREAM-INF:([^\n]+)\n([^\n]+)/);
      if (variant) {
        const attrs = hlsAttrs(variant[1]);
        if (attrs.RESOLUTION) out.video_resolution = attrs.RESOLUTION;
        if (attrs.CODECS) {
          const codecs = attrs.CODECS.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
          if (codecs[0]) out.video_codec = codecs[0];
          if (codecs[1]) out.audio_codec = codecs[1];
        }
        if (attrs.BANDWIDTH) out.video_bitrate = Math.round(attrs.BANDWIDTH / 1000);
        if (attrs['FRAME-RATE']) out.frame_rate = parseFloat(attrs['FRAME-RATE']) || null;
      }
      [...body.matchAll(/#EXT-X-MEDIA:([^\n]+)/g)].forEach((m) => {
        const md = hlsAttrs(m[1]);
        if (md.TYPE === 'AUDIO') {
          out.audio_tracks.push({ language: md.LANGUAGE || md.NAME || null, name: md.NAME || null, uri: nn(md.URI) });
        } else if (md.TYPE === 'SUBTITLES' || md.TYPE === 'CLOSED-CAPTIONS') {
          out.subtitle_tracks.push({ language: md.LANGUAGE || md.NAME || null, name: md.NAME || null, kind: md.TYPE });
          if (md.URI && !out.subtitle_url) out.subtitle_url = md.URI;
        }
      });
    } else {
      const durs = [...body.matchAll(/#EXTINF:([\d.]+)/g)].map((m) => parseFloat(m[1]));
      if (durs.length) out.video_duration = Math.round(durs.reduce((a, b) => a + b, 0) * 10) / 10;
      if (/EXT-X-KEY:(?!.*METHOD=NONE)/.test(body)) out.drm_protection = true;
    }

    const res = resolutionOf(chapter);
    if (!out.video_resolution && res) out.video_resolution = res;
    return out;
  } catch (e) {
    out.playback_status = 'PROBE_GAGAL: ' + ((e && e.message) || e);
    return out;
  }
}

function hlsAttrs(s) {
  const out = {};
  const re = /([A-Z0-9-]+)=("[^"]*"|[^,]+)/g;
  let m;
  while ((m = re.exec(s))) out[m[1]] = m[2].replace(/^"|"$/g, '');
  return out;
}

/* terapkan hasil probe ke objek episode */
function applyProbe(ep, probe) {
  if (!ep || !probe) return false;
  if (probe.video_resolution) ep.video_resolution = probe.video_resolution;
  ep.video_codec = probe.video_codec;
  ep.audio_codec = probe.audio_codec;
  ep.video_bitrate = probe.video_bitrate;
  ep.frame_rate = probe.frame_rate;
  ep.audio_tracks = probe.audio_tracks;
  ep.subtitle_tracks = probe.subtitle_tracks;
  ep.subtitle_url = probe.subtitle_url;
  if (probe.video_duration != null) ep.video_duration = probe.video_duration;
  if (probe.drm_protection) ep.drm_protection = probe.drm_protection;
  ep.playback_status = probe.playback_status;
  ep.playback_probe = probe.probed ? 'm3u8' : null;
  return true;
}

/* ================== GOOGLE PLAY ================== */

async function scrapeGooglePlay() {
  const html = await request(PLAY_URL, {
    headers: {
      'User-Agent': UAS[2],
      Accept: 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    retries: 5,
  });
  const $ = cheerio.load(html);

  let ld = null;
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const j = JSON.parse($(el).text());
      if (j['@type'] === 'SoftwareApplication') ld = j;
    } catch (e) {}
  });

  const pairs = [];
  $('div.wVqUob').each((i, el) => {
    const a = $(el).find('div.ClM7O').first().text().trim();
    const b = $(el).find('div.g1rdde').first().text().trim();
    if (a && b) pairs.push({ value: a, label: b });
  });
  const dlPair = pairs.find((p) => /download/i.test(p.label)) || pairs[0];

  const devName = (ld && ld.author && ld.author.name) || null;
  const devUrl = (ld && ld.author && ld.author.url) || null;
  const iap = /In-app purchases/.test(html);
  const atpRank = html.match(/"ClM7O">([^<]+)<\/div>\s*<div class="g1rdde">Downloads/);
  const offers = (ld && ld.offers) || [];

  return {
    title: (ld && ld.name) || ($('h1').first().text().trim() || null),
    package: APPID_PLAY,
    url: PLAY_URL,
    developer: devName,
    developer_url: nn(devUrl),
    icon_url: nn(ld && ld.image),
    description: nn(ld && ld.description),
    genre: nn(ld && ld.applicationCategory) || 'Entertainment',
    content_rating: (ld && ld.contentRating) || null,
    rating: (ld && ld.aggregateRating && Number(ld.aggregateRating.ratingValue)) || null,
    rating_count: (ld && ld.aggregateRating && Number(ld.aggregateRating.ratingCount)) || null,
    downloads: (atpRank && atpRank[1]) || (dlPair && dlPair.value) || null,
    price: offers.length ? String(offers[0].price) : null,
    price_currency: offers.length ? offers[0].priceCurrency : null,
    in_app_purchases: iap,
    availability: offers.length ? offers[0].availability : null,
    lang_page: 'en',
    scraped_at: new Date().toISOString(),
  };
}

/* ================== CLI + MAIN ================== */

function argval(argv, flag, envKey) {
  const i = argv.indexOf(flag);
  if (i !== -1 && argv[i + 1] != null && !argv[i + 1].startsWith('--')) return String(argv[i + 1]);
  if (envKey && process.env[envKey]) return String(process.env[envKey]);
  return null;
}

const warnings = [];

async function main() {
  const argv = process.argv.slice(2);
  const locale = argval(argv, '--locale', 'LOCALE') || 'in';
  if (!LOCALES.includes(locale)) {
    console.error(`Locale tidak valid: ${locale}. Pilihan: ${LOCALES.join('|')}`);
    process.exit(1);
  }

  const fullMode = argv.includes('--full');
  const noPlay = argv.includes('--no-play');
  const explicitPages = argval(argv, '--pages', 'PAGES') != null ? parseInt(argval(argv, '--pages', 'PAGES'), 10) : null;
  const maxPages = fullMode ? (explicitPages || (argv.includes('--full-all-pages') ? 999 : 3)) : explicitPages || 1;
  const detailAll = parseInt(argval(argv, '--detail-all', 'DETAIL_ALL') || '0', 10) || (fullMode ? 10 : 6);
  const playbackProbe = parseInt(argval(argv, '--playback', 'PLAYBACK') == null ? '2' : argval(argv, '--playback', 'PLAYBACK'), 10) || 0;
  const idsFlag = argval(argv, '--id', 'DRAMA_ID');
  const catFlag = argval(argv, '--category', 'CATEGORY');
  const searchQ = argval(argv, '--search', 'SEARCH');
  const outFile = argval(argv, '--out', 'OUT');

  const meta = {
    scraper: `${pkg.name} v${pkg.version}`,
    engine: 'axios + cheerio (ringan, tanpa headless browser)',
    targets: [PLAY_URL, APP_W],
    locale,
    mode: argv.length ? argv.join(' ') : 'default',
    scraped_at: new Date().toISOString(),
    config: { retries: RETRIES, timeout_ms: TIMEOUT_MS, concurrency: CONCURRENCY, delay_ms: DELAY_MS, playback_probe_per_drama: playbackProbe },
  };

  const book = new DramaBook();
  const steps = [];
  let appInfo = null;
  const searchOut = [];
  let categories = [];
  const catOut = [];
  const moreOut = [];
  const sectionSeen = new Map();
  let homeSections = [];

  /* ---- 1. Google Play (terpisah, gagal tidak memblokir utama) ---- */
  if (noPlay) steps.push('google_play dilewati (--no-play)');
  else {
    for (let att = 1; att <= 2 && !appInfo; att++) {
      try {
        appInfo = await scrapeGooglePlay();
        steps.push('google_play OK');
      } catch (e) {
        warnings.push(`google_play (percobaan ${att}): ${e.message}`);
        if (att < 2) await sleep(5000);
      }
    }
  }

  /* ---- 2. Sumber data DramBox sesuai mode ---- */
  if (idsFlag) {
    const ids = idsFlag.split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
    const got = await pool(ids, async (id) => {
      await sleep(DELAY_MS);
      const d = await scrapeDetail(id, locale, playbackProbe);
      for (const ch of d.probeList) applyProbe(findEpisode(d.detail, ch.id), await probeHls(ch));
      return d.detail;
    });
    for (const det of got) {
      if (!det || det.error) {
        if (det && det.error) warnings.push(`detail ${det.for_id || ''}: ${det.error}`);
        continue;
      }
      book.add(
        {
          bookId: det.drama_id,
          bookName: det.title,
          cover: det.cover_url,
          introduction: det.description,
          typeTwoNames: det.genre,
          tags: det.tags,
          viewCount: det.popularity,
          chapterCount: det.total_episodes,
          firstShelfTime: det.release_date,
          shelfTime: det.update_date,
          language: 'ENGLISH',
          typeOneName: det.type_one,
          alias: det.aliases.length ? det.aliases[0] : null,
          protagonist: det.protagonist,
        },
        {
          locale,
          feed_section: 'Detail',
          section_id: det.drama_id,
          section_name: 'Detail Drama',
          section_position: 'film',
          display_position: null,
        }
      );
      const card = book.map.get(String(det.drama_id));
      if (card) {
        card.episodes = det.episodes;
        mergeDetail(card, det);
      }
    }
    steps.push(`detail ${got.filter((g) => g && !g.error).length}/${ids.length} drama OK`);
  } else {
    /* beranda + more feeds */
    try {
      const home = await scrapeHomepage(locale, book);
      homeSections = home.sections;
      steps.push('homepage OK');
    } catch (e) {
      warnings.push(`homepage: ${e.message}`);
    }
    for (const pos of FEED_POSITIONS) {
      await sleep(DELAY_MS);
      try {
        await scrapeMoreSection(pos, locale, book, maxPages, moreOut, sectionSeen);
        steps.push(`more:${pos} OK`);
      } catch (e) {
        warnings.push(`more ${pos}: ${e.message}`);
      }
    }
    /* kategori */
    if (catFlag) {
      const cats = catFlag.split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
      for (const cid of cats) {
        await sleep(DELAY_MS);
        try {
          await scrapeCategory(locale, book, cid, maxPages, catOut);
          steps.push(`kategori:${cid} OK`);
        } catch (e) {
          warnings.push(`kategori ${cid}: ${e.message}`);
        }
      }
    } else if (fullMode) {
      let catList = [];
      try {
        catList = await categoriesOf(locale);
      } catch (e) {
        warnings.push(`kategori index: ${e.message}`);
      }
      for (const cat of catList) {
        await sleep(DELAY_MS);
        try {
          await scrapeCategory(locale, book, cat.category_id, maxPages, catOut);
        } catch (e) {
          warnings.push(`kategori ${cat.category_id}: ${e.message}`);
        }
      }
      steps.push(`kategori penuh: ${catList.length} kategori`);
    }
    /* pencarian */
    if (searchQ) {
      try {
        await scrapeSearch(searchQ, locale, book, Math.min(2, maxPages), searchOut);
        steps.push('pencarian OK');
      } catch (e) {
        warnings.push(`pencarian: ${e.message}`);
      }
    }
  }

  /* ---- 3. Detail + probe playback untuk sebagian drama teratas ---- */
  if (!idsFlag) {
    const priority = [];
    const rest = [];
    for (const card of book.list()) {
      const rank = card.placements.some((p) => p.section_position === 'top-hits' || p.section_position === 'trending');
      (rank ? priority : rest).push(card.drama_id);
    }
    const detailIds = [...priority, ...rest].slice(0, detailAll).filter((id) => !book.map.get(id).episodes);
    if (detailIds.length) {
      await pool(detailIds, async (id) => {
        await sleep(DELAY_MS);
        const d = await scrapeDetail(id, locale, playbackProbe);
        for (const ch of d.probeList) applyProbe(findEpisode(d.detail, ch.id), await probeHls(ch));
        const card = book.map.get(String(d.detail.drama_id));
        if (card) {
          card.episodes = d.detail.episodes;
          mergeDetail(card, d.detail);
        }
        return true;
      });
      steps.push(`detail/${detailIds.length} drama teratas + probe playback`);
    }
  }

  /* ---- 4. Susun output ---- */
  try {
    categories = await categoriesOf(locale);
    steps.push('daftar kategori OK');
  } catch (e) {
    warnings.push(`kategori ok: ${e.message}`);
  }

  const dramas = book.list();
  const ranking = {};
  for (const pos of ['top-hits', 'trending']) {
    const rows = dramas
      .filter((d) => d.placements.some((p) => p.section_position === pos))
      .map((d) => ({
        d,
        best: Math.min(...d.placements.filter((p) => p.section_position === pos).map((p) => p.display_position)),
      }))
      .sort((a, b) => a.best - b.best)
      .map((x, i) => ({
        ranking_position: i + 1,
        section_position: x.best,
        drama_id: x.d.drama_id,
        title: x.d.title,
        rating: x.d.rating,
        popularity: x.d.popularity,
        view_count_display: x.d.view_count_display,
        badges: x.d.drama_badge,
      }));
    if (rows.length) ranking[pos === 'top-hits' ? 'Drama Terpopuler' : 'Sedang Tren'] = rows;
  }

  const result = {
    meta: Object.assign(meta, {
      http_stats: stats,
      steps_ok: steps,
      warnings: warnings.filter((v, i, a) => a.indexOf(v) === i),
      counts: {
        dramas: dramas.length,
        with_detail_episodes: dramas.filter((d) => d.episodes).length,
        total_episode_scraped: dramas.reduce((a, d) => a + (d.episodes ? d.episodes.length : 0), 0),
        feed_sections: homeSections.length + moreOut.length + catOut.length + searchOut.length,
        categories: categories.length,
        ranking_rows: Object.values(ranking).reduce((a, r) => a + r.length, 0),
      },
      notes: {
        metode: 'Baca NEXT_DATA halaman web statis (SSG/SSR) + parse manifest HLS. Tanpa Playwright/Puppeteer/Selenium.',
        feed_section: 'Untukmu = beranda; Daftar Peringkat = more/top-hits & more/trending; Terbaru = must-sees & hidden-gems; Kategori = /browse; Pencarian = /search',
        episode_access: 'FREE = unlock:true, VIP = perlu dibuka',
        subtitle_dubbing: 'bila tidak disediakan halaman web akan berupa array kosong',
        signed_urls: 'URL mp4/m3u8 berisi tanda tangan berbatas waktu (Expires), scraper ulang akan di-generate ulang',
        kolom_kosong: 'country & trailer_url tidak diekspos pada dramaboxapp.com -> null',
      },
    }),
    app_info_dramabox_googleplay: appInfo,
    feed_sections: {
      homepage: homeSections,
      more: moreOut,
      kategori: catOut,
      pencarian: searchOut,
    },
    ranking,
    categories,
    search: searchOut.length ? searchOut : null,
    dramas,
  };

  /* rapikan feed utama per drama */
  result.dramas = result.dramas.map((d) => {
    const best =
      d.placements.find((p) => p.feed_section !== 'Detail' && p.display_position != null) ||
      d.placements[0] ||
      {
        feed_section: 'Detail',
        section_id: d.drama_id,
        section_name: 'Detail Drama',
        section_position: 'film',
        display_position: null,
        ranking_position: null,
      };
    d.feed = best;
    if (!d.recommendation_status) d.recommendation_status = recStatusOf(best.feed_section);
    if (d.category_id == null && best.category_id != null) d.category_id = best.category_id;
    if (!d.category_name && best.category_name) d.category_name = best.category_name;
    if (!d.drama_badge) d.drama_badge = [];
    if (d.episodes) {
      d.episode_count_scraped = d.episodes.length;
      d.episodes_free_vip = {
        free: d.episodes.filter((e) => e.episode_access === 'FREE').length,
        vip: d.episodes.filter((e) => e.episode_access === 'VIP').length,
      };
    }
    return d;
  });

  const outPath = outFile || `hasil-dramabox-${Date.now()}.json`;
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log('==== DRAMABOX SCRAPER SELESAI ====');
  console.log(`Lokal        : ${locale}`);
  console.log(`HTTP         : ${stats.requests} req, ${stats.retries} retry, ${stats.ok} sukses, ${stats.fail} gagal`);
  if (appInfo) {
    console.log(`Google Play  : ${appInfo.title} | rating ${appInfo.rating} (${appInfo.rating_count} ulasan) | downloads ${appInfo.downloads}`);
  }
  console.log(`Dramas       : ${result.meta.counts.dramas} (${result.meta.counts.with_detail_episodes} detail penuh, ${result.meta.counts.total_episode_scraped} episode)`);
  console.log(`Peringkat    : ${Object.values(ranking).reduce((a, r) => a + r.length, 0)} baris | Kategori: ${categories.length}`);
  if (warnings.length) console.log(`Peringatan   : ${[...new Set(warnings)].slice(0, 6).join(' | ')}`);
  console.log(`Output       : ${path.resolve(outPath)}`);

  return result;
}

function findEpisode(detail, chapterId) {
  return detail && detail.episodes ? detail.episodes.find((e) => e.episode_id === String(chapterId)) : null;
}

function mergeDetail(card, det) {
  Object.assign(card, {
    title: det.title || card.title,
    cover_url: det.cover_url || card.cover_url,
    thumbnail_url: det.thumbnail_url || card.thumbnail_url,
    description: det.description || card.description,
    genre: det.genre && det.genre.length ? det.genre : card.genre,
    category: det.category || card.category,
    tags: det.tags && det.tags.length ? det.tags : card.tags,
    language: det.language || card.language,
    subtitle_languages: det.subtitle_languages || card.subtitle_languages,
    dubbing_languages: det.dubbing_languages || card.dubbing_languages,
    release_date: det.release_date || card.release_date,
    update_date: det.update_date || card.update_date,
    drama_status: det.drama_status || card.drama_status,
    total_episodes: det.total_episodes || card.total_episodes,
    popularity: det.popularity != null ? det.popularity : card.popularity,
    view_count: det.view_count != null ? det.view_count : card.view_count,
    view_count_display: card.view_count_display,
    follow_count: det.follow_count != null ? det.follow_count : card.follow_count,
    author: det.author || card.author,
    type_one: det.type_one || card.type_one,
    aliases: det.aliases && det.aliases.length ? det.aliases : card.aliases,
    protagonist: det.protagonist || card.protagonist,
    drama_badge: Array.from(new Set([...(card.drama_badge || []), ...(det.drama_badge || [])])),
    category_id: det.category_id != null ? det.category_id : (card.category_id != null ? card.category_id : null),
    category_name: det.category_name || (card.category_name || null),
    recommendation_status: card.recommendation_status || 'DIRECT_DETAIL',
    web_url: det.web_url || card.web_url,
    categories_detail: det.categories_detail,
    ui_languages: det.ui_languages,
    episode_tabs: det.episode_tabs,
    recommends: det.recommends,
  });
}

if (require.main === module) {
  main().then(
    (r) => {
      const hasilKosong = !r.dramas.length && !r.app_info_dramabox_googleplay;
      if (hasilKosong) {
        console.error('PERINGATAN AKHIR: hasil masih kosong total.');
        process.exitCode = 2;
      }
    },
    (e) => {
      console.error('FATAL:', (e && e.stack) || e);
      process.exitCode = 1;
    }
  );
}

module.exports = { main, request, probeHls, extractNextData, scrapeGooglePlay, scrapeDetail };