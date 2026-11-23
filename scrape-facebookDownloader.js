/**
 * Name : Facebook Downloader
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps : https://getfvido(.)com
 * Type : Scraper/JSON
 * Description : Video Facebook Downloader Ekstrak MP4 HD/SD, semua format yang tersedia, dan tautan audio MP3 siap pakai dari URL video Facebook publik.
 * Note : Error fix sendiri.
 **/

import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const BASE_URL = 'https://getfvido.com';
const API_URL = `${BASE_URL}/wp-json/aio-dl/video-data/`;
const MP3_ENDPOINT = 'https://fbdownlo.com/stream-audio?url=';
const TIMEOUT_MS = 30000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

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

const userAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

function reply(status, data = [], error) {
  return [
    {
      status,
      response: HTTP_STATUS[status] ?? 'Unknown',
      ...(error ? { error: `ERROR ${status} ${HTTP_STATUS[status] ?? 'Unknown'}: ${error}` } : {}),
    },
    {
      data,
    },
  ];
}

async function getToken() {
  const res = await fetch(`${BASE_URL}/`, {
    headers: {
      'User-Agent': userAgent(),
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Token page returned HTTP ${res.status}`);
  }

  const html = await res.text();
  const token =
    html.match(/id="token"[^>]*value="([^"]+)"/)?.[1] ??
    html.match(/name="token"[^>]*value="([^"]+)"/)?.[1];

  if (!token) {
    throw new Error('Downloader token not found');
  }

  return token;
}

function normalizeFormats(medias) {
  return medias
    .filter((media) => media && media.url)
    .map((media) => ({
      quality: media.quality ?? 'Unknown',
      extension: media.extension ?? '',
      size: media.size ?? 0,
      formattedSize: media.formattedSize ?? '',
      video: Boolean(media.videoAvailable),
      audio: Boolean(media.audioAvailable),
      url: media.url,
    }));
}

export async function facebook(url) {
  try {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return reply(400, [], 'A valid Facebook video URL is required');
    }

    const token = await getToken();

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'User-Agent': userAgent(),
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
      },
      body: new URLSearchParams({ url, token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const body = await res.text();
    let json;

    try {
      json = JSON.parse(body);
    } catch {
      throw new Error(`Engine returned non-JSON response (HTTP ${res.status})`);
    }

    if (!res.ok || json.error) {
      const status = res.status === 200 ? 400 : res.status;
      return reply(status, [], json.error ?? `Engine returned HTTP ${res.status}`);
    }

    const formats = normalizeFormats(Array.isArray(json.medias) ? json.medias : []);

    if (!formats.length) {
      return reply(404, [], 'No downloadable media found for this URL');
    }

    const videos = formats.filter((format) => format.video);
    const audios = formats.filter((format) => format.audio && !format.video);
    const hd = [...videos].sort((a, b) => b.size - a.size)[0] ?? null;
    const sd = [...videos].sort((a, b) => a.size - b.size)[0] ?? null;
    const audio = audios[0] ?? null;
    const mp3Source = audio?.url ?? hd?.url ?? null;
    const mp3 = audio?.extension === 'mp3'
      ? audio.url
      : mp3Source
        ? MP3_ENDPOINT + encodeURIComponent(mp3Source)
        : null;

    const data = {
      url,
      title: json.title ?? null,
      thumbnail: json.thumbnail ?? null,
      duration: json.duration ?? null,
      source: json.source ?? 'facebook',
      formats,
      downloads: {
        hd: hd?.url ?? null,
        sd: sd?.url ?? null,
        audio: audio?.url ?? null,
        mp3,
      },
    };

    return reply(200, [data]);
  } catch (err) {
    const message = err?.name === 'TimeoutError'
      ? `Request timed out after ${TIMEOUT_MS / 1000}s`
      : err?.message ?? 'Unexpected error';

    return reply(500, [], message);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const url = process.argv[2];

  if (!url) {
    console.error('Usage: node getfvido-facebook.js <facebook-video-url>');
    process.exit(1);
  }

  const result = await facebook(url);
  const json = JSON.stringify(result, null, 2);

  console.log(json);
  writeFileSync('result.json', json);
  console.error('\nSaved to result.json');
}
