#!/usr/bin/env node

/**
 * Name: scrape-animein
 * Creator: Razeerh
 * Source: https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps: https://play.google.com/store/apps/details?id=okeko.animein.stream | https://animeinweb.com
 * Type: Scraper/JSON
 * Description: AnimeIn scraper for homepage, schedule, search, detail, episodes, genres, stream embed, downloads, ongoing, latest, and complete.
 * Note: Menggunakan API seluler dengan header ok http. Streaming tidak pernah mengembalikan tautan MP4 mentah; unduhan mengembalikan tautan MP4 langsung. Btw ini udah lengkap ya harusnya, cobain aja dah. Error fix sendiri.
 **/

import fs from 'node:fs';

const API = 'https://xyz-api.animein.net';
const WEB = 'https://animeinweb.com';
const TIMEOUT = 30000;
const PAGE_SIZE = 60;
const EPISODE_PAGE_SIZE = 30;
const AUTH = {
  id_user: '0',
  key_client: 'guest',
  apk_ver: '5.2.2'
};
const HEADERS = {
  'User-Agent': 'okhttp/4.12.0',
  apk_ver: '5.2.2',
  Accept: 'application/json'
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
  503: 'Service Unavailable'
};
const DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

const asPage = (value) => Math.max(1, Number(value) || 1);
const asId = (value) => String(value ?? '').trim();
const qualityRank = (value) => Number(String(value ?? '').replace(/\D/g, '')) || 0;

function apiUrl(path, params = {}) {
  const url = new URL(path, API);

  for (const [key, value] of Object.entries({ ...AUTH, ...params })) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function api(path, params = {}) {
  const res = await fetch(apiUrl(path, params), {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT)
  });

  const text = await res.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    const error = new Error(`API returned non-JSON response (HTTP ${res.status}).`);
    error.status = res.status >= 400 ? res.status : 500;
    throw error;
  }

  if (!res.ok || !body || body.error || (body.status && body.status !== 200)) {
    const error = new Error(body?.message || body?.error || `HTTP ${res.status} ${res.statusText}`);
    const status = Number(body?.status) || res.status || 500;
    error.status = status >= 400 ? status : 500;
    throw error;
  }

  return body.data;
}

function ok(data, extra = {}) {
  return [
    {
      status: 200,
      response: 'OK',
      ...extra
    },
    {
      data
    }
  ];
}

function fail(error, extra = {}) {
  const status = Number(error?.status) || 500;
  const response = HTTP_STATUS[status] ?? 'Error';

  return [
    {
      status,
      response,
      ...extra,
      error: `ERROR ${status} ${response}: ${error?.message ?? 'Unknown error'}`
    },
    {
      data: []
    }
  ];
}

export async function homepage(limit = 0) {
  try {
    const home = await api('/data/home/list');

    if (limit > 0 && home && typeof home === 'object') {
      for (const [key, value] of Object.entries(home)) {
        if (Array.isArray(value)) home[key] = value.slice(0, limit);
      }
    }

    return ok([home ?? {}], limit > 0 ? { limit } : {});
  } catch (error) {
    return fail(error);
  }
}

export async function schedule(day) {
  try {
    const selected = String(day || DAYS[new Date().getDay()]).toUpperCase();

    if (!DAYS.includes(selected)) {
      const error = new Error(`Invalid day "${day}". Use one of: ${DAYS.join(', ')}.`);
      error.status = 400;
      throw error;
    }

    const data = await api('/3/2/schedule/data', { day: selected });

    return ok([{
      day: selected,
      movie: data?.movie ?? []
    }]);
  } catch (error) {
    return fail(error);
  }
}

export async function search(query, page = 1) {
  try {
    const keyword = String(query ?? '').trim();

    if (!keyword) {
      const error = new Error('Search query is required. Usage: node scrape-animein.js search "naruto" --1');
      error.status = 400;
      throw error;
    }

    const current = asPage(page);
    const data = await api('/3/2/explore/movie', {
      page: current - 1,
      sort: 'latest',
      keyword
    });
    const movies = data?.movie ?? [];

    return ok(movies, {
      page: current,
      query: keyword,
      has_next: movies.length >= PAGE_SIZE
    });
  } catch (error) {
    return fail(error);
  }
}

export async function detail(id) {
  try {
    const movieId = asId(id);

    if (!movieId) {
      const error = new Error('Movie ID is required. Usage: node scrape-animein.js detail 6484');
      error.status = 400;
      throw error;
    }

    const data = await api(`/3/2/movie/detail/${encodeURIComponent(movieId)}`);

    return ok([{
      ...(data ?? {}),
      watch_url: `${WEB}/anime/${movieId}`
    }]);
  } catch (error) {
    return fail(error);
  }
}

export async function episodes(id, page = 1) {
  try {
    const movieId = asId(id);

    if (!movieId) {
      const error = new Error('Movie ID is required. Usage: node scrape-animein.js episodes 6484 --1');
      error.status = 400;
      throw error;
    }

    const current = asPage(page);
    const data = await api(`/3/2/movie/episode/${encodeURIComponent(movieId)}`, {
      page: current - 1
    });
    const list = data?.episode ?? [];

    return ok(list, {
      page: current,
      movie_id: movieId,
      has_next: list.length >= EPISODE_PAGE_SIZE
    });
  } catch (error) {
    return fail(error);
  }
}

export async function genres() {
  try {
    const data = await api('/3/2/explore/genre');
    const list = data?.genre ?? [];

    return ok(list, { total: list.length });
  } catch (error) {
    return fail(error);
  }
}

export async function latest(page = 1) {
  try {
    const current = asPage(page);
    const data = await api('/3/2/explore/movie', {
      page: current - 1,
      sort: 'latest'
    });
    const movies = data?.movie ?? [];

    return ok(movies, {
      page: current,
      has_next: movies.length >= PAGE_SIZE
    });
  } catch (error) {
    return fail(error);
  }
}

async function byStatus(status, page = 1) {
  try {
    const current = asPage(page);
    const data = await api('/3/2/home/hot', { page: 0 });
    const movies = (data?.movie ?? []).filter((movie) => movie.status === status);
    const total = movies.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (current - 1) * PAGE_SIZE;
    const items = movies.slice(start, start + PAGE_SIZE);

    return ok(items, {
      page: current,
      total,
      total_pages: totalPages,
      has_next: current < totalPages
    });
  } catch (error) {
    return fail(error);
  }
}

export function ongoing(page = 1) {
  return byStatus('ONGOING', page);
}

export function complete(page = 1) {
  return byStatus('FINISHED', page);
}

async function streamData(id) {
  const episodeId = asId(id);

  if (!episodeId) {
    const error = new Error('Episode ID is required. Usage: node scrape-animein.js stream 321323');
    error.status = 400;
    throw error;
  }

  return api(`/3/2/episode/streamnew/${encodeURIComponent(episodeId)}`);
}

export async function stream(id) {
  try {
    const data = await streamData(id);
    const episode = data?.episode;

    if (!episode) {
      return ok([{
        episode: null,
        next_episode: null,
        embed: null,
        iframe: null,
        servers: [],
        note: 'Episode not found or has no stream data.'
      }]);
    }

    const official = `${WEB}/anime/${episode.id_movie}?ep=${episode.id}`;
    const servers = (data.server ?? [])
      .map((server) => ({
        name: server.name ?? null,
        quality: server.quality ?? null,
        type: server.type ?? null,
        embed: server.type === 'semi' && server.link ? server.link : null
      }))
      .sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality));
    const iframe = servers.find((server) => server.embed)?.embed ?? null;

    return ok([{
      episode,
      next_episode: data.episode_next ?? null,
      embed: official,
      iframe,
      servers,
      note: iframe
        ? 'Use iframe for an iframe-friendly semi server. embed is the official watch page.'
        : 'No semi embed server is available. embed is the official watch page and sets X-Frame-Options: SAMEORIGIN.'
    }]);
  } catch (error) {
    return fail(error);
  }
}

export async function download(id) {
  try {
    const data = await streamData(id);
    const episode = data?.episode;

    if (!episode) {
      return ok([{
        episode: null,
        downloads: []
      }]);
    }

    const downloads = (data.server ?? [])
      .filter((server) => server.type === 'direct' && server.link)
      .map((server) => ({
        name: server.name ?? null,
        quality: server.quality ?? null,
        type: server.type,
        url: server.link,
        size: server.key_file_size ?? null,
        server_id: server.server_id ?? null,
        headers: {
          'User-Agent': HEADERS['User-Agent'],
          apk_ver: HEADERS.apk_ver,
          Referer: `${WEB}/`
        }
      }))
      .sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality));

    return ok([{
      episode,
      downloads
    }]);
  } catch (error) {
    return fail(error);
  }
}

export const episode = stream;
export const episodeDetail = stream;

const HELP = `AnimeIn scraper

Usage:
  node scrape-animein.js homepage [--N]        N = max items per section
  node scrape-animein.js schedule [DAY]        DAY = MINGGU..SABTU (default today)
  node scrape-animein.js search "query" [--N]  N = page
  node scrape-animein.js detail <movieId>
  node scrape-animein.js episodes <movieId> [--N]
  node scrape-animein.js genres
  node scrape-animein.js latest [--N]
  node scrape-animein.js ongoing [--N]
  node scrape-animein.js complete [--N]
  node scrape-animein.js stream <episodeId>
  node scrape-animein.js download <episodeId>
  node scrape-animein.js episode <episodeId>   same as stream

Aliases:
  home, jadwal, anime, episode-list, genre, new, completed, embed, episode-detail

Notes:
  - Every command prints JSON and writes result.json in the current directory.
  - Stream returns embed URLs only. Download returns direct MP4 links with a Referer header.
  - Ongoing and complete are filtered from the full homepage catalog.`;

async function main() {
  const args = process.argv.slice(2);
  const command = String(args.shift() || 'homepage').toLowerCase();

  if (['help', '--help', '-h'].includes(command)) {
    console.log(HELP);
    return;
  }

  const numericFlag = args.find((arg) => /^--\d+$/.test(arg));
  const page = numericFlag ? asPage(numericFlag.slice(2)) : 1;
  const limit = numericFlag ? Math.max(1, Number(numericFlag.slice(2))) : 0;
  const positional = args.filter((arg) => !/^--\d+$/.test(arg));
  const dayFlag = args.find((arg) => arg.startsWith('--day='));
  const day = dayFlag ? dayFlag.slice(6) : positional[0];

  let result;

  switch (command) {
    case 'homepage':
    case 'home':
      result = await homepage(limit);
      break;
    case 'schedule':
    case 'jadwal':
      result = await schedule(day);
      break;
    case 'search':
      result = await search(positional[0], page);
      break;
    case 'detail':
    case 'anime':
      result = await detail(positional[0]);
      break;
    case 'episodes':
    case 'episode-list':
      result = await episodes(positional[0], page);
      break;
    case 'genres':
    case 'genre':
      result = await genres();
      break;
    case 'latest':
    case 'new':
      result = await latest(page);
      break;
    case 'ongoing':
      result = await ongoing(page);
      break;
    case 'complete':
    case 'completed':
      result = await complete(page);
      break;
    case 'stream':
    case 'embed':
    case 'episode':
    case 'episode-detail':
      result = await stream(positional[0]);
      break;
    case 'download':
      result = await download(positional[0]);
      break;
    default: {
      const error = new Error(`Unknown command "${command}". Run "node scrape-animein.js help".`);
      error.status = 404;
      result = fail(error);
    }
  }

  const output = JSON.stringify(result, null, 2);
  console.log(output);
  fs.writeFileSync('result.json', `${output}\n`);
}

main().catch((error) => {
  const output = JSON.stringify(fail(error), null, 2);
  console.log(output);

  try {
    fs.writeFileSync('result.json', `${output}\n`);
  } catch {
    // Ignore a write failure so the JSON result is still available.
  }

  process.exitCode = 1;
});
