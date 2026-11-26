/**
 * Name : melolo-scraper
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps : https://melolo.com (Melolo - com.worldance.drama)
 * Type : Scraper/JSON
 * Description : Melolo short-drama scraper for homepage, genres, search, detail, episodes, signed streams, download info, dubbing languages and recommendations.
 * Note : Lengkap ygy. Btw Error fix sendiri
 **/

import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://melolo.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const DEFAULT_LANG = 'id';
const WATERMARK = {
  creator: 'Razeerh',
  source: 'https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m',
};

const HTTP_STATUS = {
  200: 'OK',
  301: 'Moved Permanently',
  302: 'Found',
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

// The public Melolo web player serves one 720x1280 H.264/AAC MP4 per episode.
const WEB_STREAM = {
  quality: {
    label: '720p',
    width: 720,
    height: 1280,
    codec: 'avc1.640028',
    container: 'mp4',
    source: 'melolo-web',
  },
  audio: [
    {
      codec: 'aac',
      profile: 'LC',
      channels: 2,
      sample_rate: 44100,
      language: 'und',
    },
  ],
  subtitles: [],
  subtitle_note: 'Melolo web streams use burned-in subtitles. No separate subtitle track is exposed by the public web API.',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const num = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const localePath = (lang, pathname) => `${lang === 'en' ? '' : `/${lang}`}${pathname}`;
const pageUrl = (lang, pathname) => `${BASE}${localePath(lang, pathname)}`;
const seriesUrl = (lang, slug) => pageUrl(lang, `/dramas/${slug}`);
const apiUrl = (lang, slug, episode = 1) =>
  `${BASE}/api/series/getSeriesBySlug?language=${encodeURIComponent(lang)}&series_slug=${encodeURIComponent(slug)}&pageType=play&episode_id=${episode}`;

async function request(url, options = {}) {
  const { json = false, timeout = 25000, retries = 1 } = options;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: json ? 'application/json' : 'text/html,application/xhtml+xml',
        Referer: `${BASE}/`,
      },
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      throw err;
    }

    return json ? await res.json() : await res.text();
  } catch (err) {
    const retryable = !err.status || err.status === 429 || err.status >= 500;
    if (retries > 0 && retryable) {
      await delay(err.status === 429 ? 1500 : 600);
      return request(url, { ...options, retries: retries - 1 });
    }
    throw err;
  }
}

const SIGN_TTL_SECONDS = 300;

function signInfo(url) {
  try {
    const sign = new URL(url).searchParams.get('sign');
    if (!sign) return { signed: false, issued_at: null, expires_at: null, expires_in: null, ttl_seconds: null };

    const issued = Number(sign.split('-')[0]);
    if (!issued) return { signed: true, issued_at: null, expires_at: null, expires_in: null, ttl_seconds: null };

    const expires = issued + SIGN_TTL_SECONDS;

    return {
      signed: true,
      issued_at: new Date(issued * 1000).toISOString(),
      expires_at: new Date(expires * 1000).toISOString(),
      expires_in: Math.max(0, expires - Math.floor(Date.now() / 1000)),
      ttl_seconds: SIGN_TTL_SECONDS,
    };
  } catch {
    return { signed: false, issued_at: null, expires_at: null, expires_in: null, ttl_seconds: null };
  }
}

function normalizeGenres(list) {
  return (list || [])
    .map((genre) => {
      if (typeof genre === 'string') return { slug: null, name: genre };
      return {
        slug: genre.genre_slug || genre.slug || null,
        name: genre.name || genre.genre_slug || null,
      };
    })
    .filter((genre) => genre.name);
}

function normalizeCard({ slug, title, cover, rating, rank, episode_count, description, genres }, lang) {
  return {
    series_slug: slug,
    title: title || null,
    cover: cover || null,
    rating: rating || null,
    rank: rank ?? null,
    episode_count: episode_count ?? null,
    description: description || null,
    genres: normalizeGenres(genres),
    url: seriesUrl(lang, slug),
  };
}

function cleanCover(url) {
  if (!url) return null;
  return url.split('!')[0] || null;
}

function cardFromLink($, link, lang) {
  const a = $(link);
  if (a.find('img').length) return null;

  const rawText = a.text().replace(/\s+/g, ' ').trim();
  if (!rawText) return null;

  const href = a.attr('href') || '';
  const match = href.match(/\/dramas\/([a-z0-9-]+)/i);
  if (!match) return null;

  const rankMatch = rawText.match(/^(\d+)[.)]\s+/);
  const rank = rankMatch ? Number(rankMatch[1]) : null;
  const title = (a.attr('aria-label') || rawText.replace(/^\d+[.)]\s+/, '')).trim();
  if (!title) return null;

  const slug = match[1];
  let box = a.closest('div');
  let cover = null;
  let rating = null;
  let genres = [];

  for (let depth = 0; depth < 4 && box.length; depth += 1) {
    if (!cover) {
      const image = box.find('img[alt]').first().attr('src') || box.find('img').first().attr('src');
      cover = cleanCover(image);
    }

    if (!rating) {
      const texts = box
        .find('div')
        .map((_, element) => $(element).text().trim())
        .get();
      rating = texts.find((text) => /^\d+(\.\d+)?$/.test(text) && Number(text) > 0 && Number(text) <= 10) || null;
    }

    if (!genres.length) {
      genres = box
        .find('a[href*="/category/"]')
        .map((_, element) => $(element).attr('aria-label') || $(element).text().trim())
        .get()
        .filter(Boolean);
    }

    box = box.parent();
  }

  return normalizeCard({ slug, title, cover, rating, rank, genres: [...new Set(genres)] }, lang);
}

function parseSections($, lang) {
  const sections = [];
  let current = null;

  $('h1,h2,h3,a[href*="/dramas/"]').each((_, element) => {
    const tag = (element.tagName || '').toLowerCase();

    if (/^h[1-3]$/.test(tag)) {
      const title = $(element).text().replace(/\s+/g, ' ').trim();
      if (!title) return;
      current = { title, items: [], seen: new Set() };
      sections.push(current);
      return;
    }

    if (!current) return;

    const card = cardFromLink($, element, lang);
    if (!card || current.seen.has(card.series_slug)) return;

    current.seen.add(card.series_slug);
    current.items.push(card);
  });

  return sections
    .filter((section) => section.items.length)
    .map((section) => ({
      title: section.title,
      items: section.items,
    }));
}

function parseGenres($, lang) {
  const genres = [];
  const seen = new Set();

  $('a[href*="/category/"]').each((_, element) => {
    const a = $(element);
    const match = (a.attr('href') || '').match(/\/category\/([a-z0-9-]+)/i);
    if (!match) return;

    const slug = match[1];
    const name = a.attr('aria-label') || a.text().replace(/\s+/g, ' ').trim();
    if (!name || seen.has(slug)) return;

    seen.add(slug);
    genres.push({ slug, name, url: pageUrl(lang, `/category/${slug}`) });
  });

  return genres;
}

function normalizeEpisode(episode) {
  const info = signInfo(episode.url);

  return {
    episode_id: episode.episode_id,
    episode_number: episode.episode_id,
    title: `Episode ${episode.episode_id}`,
    stream_url: info.signed ? episode.url : null,
    url: episode.url,
    playable: info.signed,
    signed: info.signed,
    needs_sign: !info.signed,
    issued_at: info.issued_at,
    expires_at: info.expires_at,
    expires_in: info.expires_in,
    ttl_seconds: info.ttl_seconds,
  };
}

function buildPlayer(streamUrl, cover, title) {
  if (!streamUrl) return null;

  const poster = cover ? ` poster="${cover}"` : '';
  const safeTitle = String(title || 'Melolo').replace(/"/g, '&quot;');

  return {
    mode: 'html5',
    iframe_supported: false,
    embed_html: `<video controls playsinline preload="metadata"${poster} title="${safeTitle}" style="width:100%;max-width:420px;background:#000"><source src="${streamUrl}" type="video/mp4"></video>`,
    note: 'melolo.com sends X-Frame-Options: SAMEORIGIN, so use embed_html instead of an iframe.',
  };
}

function streamPayload({ slug, title, cover, episode, lang }) {
  const info = signInfo(episode.url);
  const streamUrl = info.signed ? episode.url : null;

  return {
    series_slug: slug,
    series_title: title,
    episode_id: episode.episode_id,
    episode_number: episode.episode_id,
    stream_url: streamUrl,
    download_url: streamUrl,
    signed: info.signed,
    issued_at: info.issued_at,
    expires_at: info.expires_at,
    expires_in: info.expires_in,
    ttl_seconds: info.ttl_seconds,
    note: 'Signed CDN URLs are valid for about 5 minutes. Re-run the command to get a fresh URL, and send Referer: https://melolo.com/ when playing or downloading.',
    qualities: [{ ...WEB_STREAM.quality }],
    audio: WEB_STREAM.audio,
    subtitles: WEB_STREAM.subtitles,
    subtitle_note: WEB_STREAM.subtitle_note,
    player: buildPlayer(streamUrl, cover, `${title} - Episode ${episode.episode_id}`),
    download: {
      filename: `${slug}-ep-${episode.episode_id}.mp4`,
      headers: {
        Referer: `${BASE}/`,
        'User-Agent': UA,
      },
    },
    watch_url: pageUrl(lang, `/dramas/${slug}/${episode.episode_id}`),
  };
}

function normalizeRecommendations(list, lang) {
  return (list || [])
    .map((item) => {
      const slug = item.series_slug || item.novels_slug;
      if (!slug) return null;

      return normalizeCard(
        {
          slug,
          title: item.name,
          cover: item.cover_url,
          rating: item.rating,
          episode_count: item.episode_num,
          description: item.short_desc || item.desc,
          genres: item.genre_list,
        },
        lang,
      );
    })
    .filter(Boolean);
}

function normalizeDetail(detail, lang, episodes, requestedEpisode) {
  const dubbedVersions = [];
  const seenVersions = new Set();
  for (const item of detail.watch_list || []) {
    const key = `${item.language}|${item.web_url}`;
    if (seenVersions.has(key)) continue;
    seenVersions.add(key);
    dubbedVersions.push({
      language: item.language || null,
      platform: item.web_name || null,
      url: item.web_url || null,
    });
  }

  const stream = requestedEpisode
    ? streamPayload({
        slug: detail.series_slug,
        title: detail.name,
        cover: detail.cover_url,
        episode: requestedEpisode,
        lang,
      })
    : null;

  return {
    series_slug: detail.series_slug,
    title: detail.name,
    description: detail.desc,
    short_description: detail.short_desc,
    cover: detail.cover_url,
    photos: (detail.photo_list || '').split(',').map((photo) => photo.trim()).filter(Boolean),
    rating: detail.rating || null,
    reviewers: detail.reviewers_num ?? null,
    episode_count: detail.episode_num ?? episodes.length,
    release_date: detail.release_date || null,
    country: detail.country_of_origin || null,
    languages: (detail.langs || '').split(',').map((language) => language.trim()).filter(Boolean),
    genres: normalizeGenres(detail.genre_list),
    cast: detail.actor_list || [],
    dubbed_versions: dubbedVersions,
    recommendations: normalizeRecommendations(detail.recommend_series_slugs_play, lang),
    episodes,
    stream,
    stream_endpoint: `node scrape-melolo.js stream ${detail.series_slug} <episode>`,
    api_endpoint: apiUrl(lang, detail.series_slug, '<episode>'),
    source_url: seriesUrl(lang, detail.series_slug),
  };
}

async function homepage(lang, limit) {
  const html = await request(pageUrl(lang, '/category'));
  const $ = cheerio.load(html);
  const genres = parseGenres($, lang);
  const sections = parseSections($, lang).map((section) => ({
    ...section,
    items: section.items.slice(0, limit),
  }));

  return [
    {
      type: 'genres',
      title: 'Genres',
      items: genres,
    },
    ...sections.map((section) => ({
      type: 'section',
      ...section,
    })),
  ];
}

async function category(lang, genre, page, limit) {
  const currentPage = Math.max(1, page);
  const pathname = currentPage === 1 ? `/category/${genre}` : `/category/${genre}/${currentPage}`;
  const html = await request(pageUrl(lang, pathname));
  const $ = cheerio.load(html);

  const seen = new Set();
  const items = parseSections($, lang)
    .flatMap((section) => section.items)
    .filter((item) => {
      if (seen.has(item.series_slug)) return false;
      seen.add(item.series_slug);
      return true;
    })
    .slice(0, limit);

  const pageNumbers = [];
  $(`a[href*="/category/${genre}/"]`).each((_, element) => {
    const match = ($(element).attr('href') || '').match(new RegExp(`/category/${genre}/(\\d+)$`));
    if (match) pageNumbers.push(Number(match[1]));
  });

  const totalPages = Math.max(currentPage, ...pageNumbers);
  const hasNext = $('a[rel="next"]').length > 0 || currentPage < totalPages;

  return {
    genre,
    page: currentPage,
    total_pages: totalPages,
    has_next: hasNext,
    next_page: hasNext ? currentPage + 1 : null,
    items,
  };
}

async function search(lang, query, page, limit, type) {
  const currentPage = Math.max(1, page);
  const url =
    `${BASE}/api/novels/searchNovelsByQuery?language=${encodeURIComponent(lang)}` +
    `&query=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}` +
    `&page=${currentPage}&page_size=${limit}`;

  const response = await request(url, { json: true });
  const payload = response?.data || {};
  const items = (payload.page_data || [])
    .filter((item) => item && item.series_slug)
    .map((item) =>
      normalizeCard(
        {
          slug: item.series_slug,
          title: item.name,
          cover: item.cover_url,
          rating: item.rating,
          episode_count: item.episode_num,
          description: item.short_desc,
          genres: item.genre_list,
        },
        lang,
      ),
    );

  const totalPages = payload.total_pages ?? 0;
  const hasNext = currentPage < totalPages;

  return {
    query,
    type,
    page: currentPage,
    total: payload.total_count ?? items.length,
    total_pages: totalPages,
    has_next: hasNext,
    next_page: hasNext ? currentPage + 1 : null,
    type_counts: payload.type_counts || null,
    items,
  };
}

async function trending(lang, limit) {
  const html = await request(pageUrl(lang, '/ranking'));
  const $ = cheerio.load(html);

  return parseSections($, lang).map((section) => ({
    title: section.title,
    items: section.items.slice(0, limit),
  }));
}

async function detail(lang, slug, episodeId = 1) {
  const response = await request(apiUrl(lang, slug, episodeId), { json: true });

  if (!response || !Array.isArray(response.data) || response.data.length === 0) {
    const err = new Error(`Series not found: ${slug}`);
    err.status = 404;
    throw err;
  }

  const data = response.data[0];
  const episodes = (data.episode_list || []).map(normalizeEpisode);
  const requestedEpisode = episodes.find((episode) => Number(episode.episode_id) === Number(episodeId)) || null;

  if (!requestedEpisode) {
    const err = new Error(
      `Episode ${episodeId} not found for ${slug}. Available: 1-${episodes.at(-1)?.episode_id ?? 0}`,
    );
    err.status = 404;
    throw err;
  }

  return normalizeDetail(data, lang, episodes, requestedEpisode);
}

async function stream(lang, slug, episodeId) {
  const data = await detail(lang, slug, episodeId);

  if (!data.stream || !data.stream.stream_url) {
    const err = new Error(`Episode ${episodeId} is not playable or has no signed stream`);
    err.status = 404;
    throw err;
  }

  return {
    series_slug: data.series_slug,
    series_title: data.title,
    cover: data.cover,
    ...data.stream,
  };
}

async function probeSize(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Referer: `${BASE}/`,
        Range: 'bytes=0-0',
      },
      signal: AbortSignal.timeout(15000),
    });

    const match = (res.headers.get('content-range') || '').match(/\/(\d+)$/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

async function download(lang, slug, episodeId) {
  const data = await stream(lang, slug, episodeId);
  const sizeBytes = await probeSize(data.stream_url);

  return {
    ...data,
    download: {
      ...data.download,
      size_bytes: sizeBytes,
      size_mb: sizeBytes ? Number((sizeBytes / 1024 / 1024).toFixed(2)) : null,
      note: 'Signed URL expires quickly. Send the Referer header when downloading.',
    },
  };
}

async function recommend(lang, slug) {
  const data = await detail(lang, slug, 1);

  return {
    series_slug: data.series_slug,
    title: data.title,
    items: data.recommendations,
  };
}

async function complete(lang, limit, detailLimit) {
  const home = await homepage(lang, limit);
  await delay(250);

  const trend = await trending(lang, limit);
  await delay(250);

  const slugs = [];
  for (const section of [...home, ...trend]) {
    for (const item of section.items || []) {
      if (item.series_slug && !slugs.includes(item.series_slug)) slugs.push(item.series_slug);
    }
  }

  const details = [];
  for (const slug of slugs.slice(0, detailLimit)) {
    try {
      details.push(await detail(lang, slug, 1));
    } catch (err) {
      details.push({ series_slug: slug, error: err.message });
    }
    await delay(250);
  }

  return [
    {
      homepage: home,
      trending: trend,
      details,
    },
  ];
}

function parseArgs(argv) {
  let command = (argv.shift() || 'homepage').toLowerCase();
  if (command.startsWith('-')) {
    argv.unshift(command);
    command = 'help';
  }
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      flags.help = true;
      continue;
    }

    if (arg.startsWith('--')) {
      const key = arg.slice(2);

      if (/^\d+$/.test(key)) {
        flags.limit = key;
        continue;
      }

      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
      continue;
    }

    positional.push(arg);
  }

  return { command, positional, flags };
}

function slugFromInput(input) {
  if (!input) return null;
  if (input.includes('/dramas/')) return input.split('/dramas/')[1].split(/[/?#]/)[0];
  if (input.includes('/fullmovies/')) return input.split('/fullmovies/')[1].split(/[/?#]/)[0];
  return input.replace(/^\/+|\/+$/g, '');
}

async function dispatch(command, positional, flags) {
  const lang = String(flags.lang || DEFAULT_LANG).toLowerCase();
  const limit = clamp(num(flags.limit, 6), 1, 50);
  const detailLimit = clamp(num(flags.details, limit), 1, 20);
  const episodeId = Math.max(1, num(flags.episode || positional[1], 1));

  switch (command) {
    case 'homepage':
    case 'home':
    case 'index': {
      const data = await homepage(lang, limit);
      return { meta: { status: 200, response: 'OK' }, data };
    }

    case 'category':
    case 'genre': {
      const genre = positional[0];
      if (!genre) {
        const err = new Error('Genre is required. Example: node scrape-melolo.js category romance --page 1');
        err.status = 400;
        throw err;
      }

      const page = Math.max(1, num(flags.page, 1));
      const result = await category(lang, genre, page, limit);

      return {
        meta: {
          status: 200,
          response: 'OK',
          page: result.page,
          total_pages: result.total_pages,
          has_next: result.has_next,
        },
        data: [result],
      };
    }

    case 'genres':
    case 'categories': {
      const html = await request(pageUrl(lang, '/category'));
      const $ = cheerio.load(html);
      return {
        meta: { status: 200, response: 'OK' },
        data: [{ genres: parseGenres($, lang) }],
      };
    }

    case 'search':
    case 'find': {
      const query = positional.join(' ').trim();
      if (!query) {
        const err = new Error('Search query is required. Example: node scrape-melolo.js search "ceo"');
        err.status = 400;
        throw err;
      }

      const result = await search(lang, query, Math.max(1, num(flags.page, 1)), limit, String(flags.type || 'series').toLowerCase());
      return { meta: { status: 200, response: 'OK' }, data: [result] };
    }

    case 'trending':
    case 'rank':
    case 'ranking': {
      const data = await trending(lang, limit);
      return { meta: { status: 200, response: 'OK' }, data };
    }

    case 'detail':
    case 'series':
    case 'drama': {
      const slug = slugFromInput(positional[0]);
      if (!slug) {
        const err = new Error('Series slug is required. Example: node scrape-melolo.js detail obsessed-with-her-a-tale-of-love-and-revenge');
        err.status = 400;
        throw err;
      }

      const data = await detail(lang, slug, episodeId);
      return { meta: { status: 200, response: 'OK' }, data: [data] };
    }

    case 'stream':
    case 'play':
    case 'episode': {
      const slug = slugFromInput(positional[0]);
      if (!slug) {
        const err = new Error('Series slug is required. Example: node scrape-melolo.js stream <slug> 1');
        err.status = 400;
        throw err;
      }

      const data = await stream(lang, slug, episodeId);
      return { meta: { status: 200, response: 'OK' }, data: [data] };
    }

    case 'download': {
      const slug = slugFromInput(positional[0]);
      if (!slug) {
        const err = new Error('Series slug is required. Example: node scrape-melolo.js download <slug> 1');
        err.status = 400;
        throw err;
      }

      const data = await download(lang, slug, episodeId);
      return { meta: { status: 200, response: 'OK' }, data: [data] };
    }

    case 'recommend':
    case 'recommendation':
    case 'related': {
      const slug = slugFromInput(positional[0]);
      if (!slug) {
        const err = new Error('Series slug is required. Example: node scrape-melolo.js recommend <slug>');
        err.status = 400;
        throw err;
      }

      const data = await recommend(lang, slug);
      return { meta: { status: 200, response: 'OK' }, data: [data] };
    }

    case 'complete':
    case 'all': {
      const data = await complete(lang, limit, detailLimit);
      return { meta: { status: 200, response: 'OK' }, data };
    }

    case 'help': {
      return {
        meta: { status: 200, response: 'OK' },
        data: [
          {
            usage: 'node scrape-melolo.js <command> [args] [--limit N] [--page N] [--episode N] [--lang id]',
            commands: [
              'homepage [--5]',
              'genres',
              'category <genre> [--page N]',
              'search <query> [--page N] [--type series|all|novels|article]',
              'trending [--5]',
              'detail <slug|url> [--episode N]',
              'stream <slug|url> [episode]',
              'download <slug|url> [episode]',
              'recommend <slug|url>',
              'complete [--5] [--details N]',
            ],
            examples: [
              'node scrape-melolo.js "homepage" --5',
              'node scrape-melolo.js category romance --page 2 --5',
              'node scrape-melolo.js search "ceo" --5',
              'node scrape-melolo.js stream obsessed-with-her-a-tale-of-love-and-revenge 2',
              'node scrape-melolo.js "complete"',
            ],
            note: 'Every run prints JSON and writes result.json in the current directory.',
          },
        ],
      };
    }

    default: {
      const err = new Error(`Unknown command: ${command}. Run: node scrape-melolo.js help`);
      err.status = 400;
      throw err;
    }
  }
}

async function main() {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));

  let output;

  try {
    const result = await dispatch(command, positional, flags);
    output = [{ ...result.meta, ...WATERMARK }, { data: result.data }];
  } catch (err) {
    const status = err.status || 500;
    const response = HTTP_STATUS[status] || 'Unknown';
    output = [
      {
        status,
        response,
        ...WATERMARK,
        error: `ERROR ${status} ${response}: ${err.message || 'An unexpected error occurred'}`,
      },
      {
        data: [],
      },
    ];
  }

  const json = JSON.stringify(output, null, 2);
  fs.writeFileSync(path.join(process.cwd(), 'result.json'), json);
  process.stdout.write(`${json}\n`);
}

main();
