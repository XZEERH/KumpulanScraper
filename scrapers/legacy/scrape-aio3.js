/**
 * Name : AIO (All In One Downloader)
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps : https://mm(.)vidssave(.)com
 * Type : Scraper/JSON
 * Description : All In On Downloader dengan mendukung beberapa platform yang tersebut "Facebook, Instagram, YouTube, Tiktok, Pinterest, Reddit, Threads, dan Daily motion".
 * Note: Untuk platform reddit udah di tes 3x gagal dari upstream, soalnya terkena challenge parse failed. Kemungkinan parser Reddit dari server vidssave kena challenge/blok, btw Error fix sendiri.
 **/

#!/usr/bin/env node

import { webcrypto as crypto } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const API = 'https://api.vidssave.com/api/downloader-api';
const AUTH = '4c9b7d21';
const SVS = '20014';
const REQUEST_KEY = '3VIw1f6wsq4IWzs_8FBDGD8hnVHABHrqU5XsAAic6Dw';
const RESPONSE_KEY = 'k4hksOfg-Hl7qzJ1EX34d7kQ6_K5A_tClP7jzqOGbVM';
const SALT = '0fa23048626976c42dce53a8';
const SALT_FIELD = 'sb630e8b3';
const TIME_FIELD = 't37ae8b1a';
const PAYLOAD_FIELD = 'p011d8cb6';
const COMMON = { domain: 'vidssave.com', siteDomain: 'my.vidssave.com' };
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Origin: 'https://mm.vidssave.com',
  Referer: 'https://mm.vidssave.com/',
};
const PLATFORM_FLAGS = ['tiktok', 'instagram', 'facebook', 'youtube', 'pinterest', 'reddit', 'threads', 'dailymotion'];

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const b64url = (value) => Buffer.from(value).toString('base64url');
const unb64url = (value) => new Uint8Array(Buffer.from(value, 'base64url'));

function errorMessage(payload) {
  const message = payload?.msg || payload?.status_code || '';
  const match = String(message).match(/^parse error:\s*(\{[\s\S]*\})\s*$/);
  if (match) {
    try {
      return JSON.parse(match[1]).msg || message;
    } catch {}
  }
  return message;
}

function aad(id, path, kind, counter = 0) {
  const raw = JSON.stringify(['svs2', AUTH, SVS, id, path, kind, counter]);
  return encoder.encode(raw.replace(/[<>&\u2028\u2029]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`));
}

async function importKey(raw) {
  return crypto.subtle.importKey('raw', unb64url(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

const requestKey = await importKey(REQUEST_KEY);
const responseKey = await importKey(RESPONSE_KEY);

async function post(path, params) {
  const idBytes = crypto.getRandomValues(new Uint8Array(16));
  const id = b64url(idBytes);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const inner = JSON.stringify({
    [PAYLOAD_FIELD]: b64url(encoder.encode(JSON.stringify({ ...COMMON, ...params }))),
    [TIME_FIELD]: Math.floor(Date.now() / 1000),
    [SALT_FIELD]: SALT,
  });
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad(id, path, 'request'), tagLength: 128 },
    requestKey,
    encoder.encode(inner),
  ));
  const payload = new Uint8Array(28 + ciphertext.byteLength);
  payload.set(idBytes, 0);
  payload.set(iv, 16);
  payload.set(ciphertext, 28);
  const response = await fetch(API + path, {
    method: 'POST',
    headers: HEADERS,
    body: new URLSearchParams({ auth: AUTH, svs: SVS, request: b64url(payload) }),
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!response.ok) throw new Error(errorMessage(json) || `API ${path} failed with HTTP ${response.status}`);
  return { json, text, id, contentType: response.headers.get('content-type') || '' };
}

async function decode(json, id, path, counter = 0) {
  if (typeof json.data !== 'string') return json;
  const raw = unb64url(json.data);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: raw.subarray(0, 12), additionalData: aad(id, path, 'response', counter), tagLength: 128 },
    responseKey,
    raw.subarray(12),
  );
  const outer = JSON.parse(decoder.decode(plain));
  return JSON.parse(decoder.decode(unb64url(outer[PAYLOAD_FIELD])));
}

async function call(path, params) {
  const { json, id } = await post(path, params);
  if (!json) throw new Error(`API ${path} returned an invalid response`);
  return decode(json, id, path);
}

function parseEventBlocks(text) {
  const blocks = text.split(/\r?\n\r?\n/);
  const events = [];
  for (const block of blocks) {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .filter(Boolean)
      .join('\n');
    if (data) events.push(data);
  }
  return events;
}

async function progress(taskId) {
  const { json, text, id, contentType } = await post('/download/progress', { task_id: taskId });
  const payloads = [];
  if (contentType.includes('text/event-stream')) {
    const events = parseEventBlocks(text);
    for (let index = 0; index < events.length; index += 1) {
      if (events[index] === '[DONE]') continue;
      payloads.push(await decode(JSON.parse(events[index]), id, '/download/progress', index + 1));
    }
  } else {
    if (!json) throw new Error('API /download/progress returned an invalid response');
    payloads.push(await decode(json, id, '/download/progress'));
  }
  return payloads;
}

async function expandLink(link) {
  if (!link) return null;
  try {
    const response = await fetch(link, {
      method: 'GET',
      headers: HEADERS,
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
    const location = response.headers.get('location');
    return location ? new URL(location, link).href : link;
  } catch {
    return link;
  }
}

async function resolveResource(content) {
  if (!content) return null;
  const created = await call('/download/create', { request: content });
  if (created.status !== undefined && created.status !== 1) {
    throw new Error(errorMessage(created) || 'download/create failed');
  }
  const createdData = created.data || created;
  if (createdData.download_link) return expandLink(createdData.download_link);
  if (!createdData.task_id) throw new Error('download/create did not return a task');

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const events = await progress(createdData.task_id);
    for (const event of events) {
      if (event.download_link) return expandLink(event.download_link);
      if (event.status === 'failed') throw new Error(errorMessage(event) || 'download failed');
    }
  }
  throw new Error('download progress timed out');
}

function normalizeType(resource, mediaId) {
  const type = String(resource.type || '').toLowerCase();
  if (type === 'picture' || type === 'image') return 'image';
  if (type === 'audio') return 'audio';
  if (type === 'video') return 'video';
  if (/audio/i.test(mediaId || '')) return 'audio';
  const format = String(resource.format || '').toLowerCase();
  if (/^(jpg|jpeg|png|webp|gif|avif)$/.test(format)) return 'image';
  if (/^(mp3|m4a|aac|ogg|opus|wav)$/.test(format)) return 'audio';
  return 'video';
}

function qualityRank(quality) {
  const value = String(quality || '').toUpperCase();
  if (value === 'ORIGIN' || value === 'ORIGINAL') return 100000;
  const pixels = value.match(/(\d+)\s*P/);
  if (pixels) return Number(pixels[1]);
  const bitrate = value.match(/(\d+)\s*KBPS/);
  if (bitrate) return Number(bitrate[1]);
  const number = value.match(/\d+/);
  return number ? Number(number[0]) : 0;
}

function cleanQuality(quality) {
  return String(quality || '').replace(/^\d+\s*-\s*/, '').trim();
}

function makeItem(resource, mediaId) {
  return {
    type: normalizeType(resource, mediaId),
    format: String(resource.format || '').toUpperCase(),
    quality: cleanQuality(resource.quality),
    url: resource.download_url || null,
    size: Number(resource.size) || null,
    content: resource.resource_content || null,
  };
}

function itemKey(item) {
  return `${item.type}|${item.format}|${item.quality.toLowerCase()}`;
}

function mergeItem(primary, secondary) {
  return {
    type: primary.type || secondary.type,
    format: primary.format || secondary.format,
    quality: primary.quality || secondary.quality,
    url: primary.url || secondary.url,
    size: primary.size || secondary.size,
    content: primary.content || secondary.content,
  };
}

function collectResources(data) {
  const top = [];
  const media = [];
  if (Array.isArray(data.resources)) {
    for (const resource of data.resources) top.push({ id: resource.resource_id || null, item: makeItem(resource, null) });
  }
  if (Array.isArray(data.media)) {
    for (const entry of data.media) {
      for (const resource of entry.resources || []) media.push(makeItem(resource, entry.media_id));
    }
  }

  const seen = new Set();
  const groups = new Map();
  for (const entry of top) {
    if (entry.id) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
    }
    const key = itemKey(entry.item);
    if (!groups.has(key)) groups.set(key, { top: [], media: [] });
    groups.get(key).top.push(entry.item);
  }
  for (const item of media) {
    const key = itemKey(item);
    if (!groups.has(key)) groups.set(key, { top: [], media: [] });
    groups.get(key).media.push(item);
  }

  const result = [];
  for (const group of groups.values()) {
    const count = Math.max(group.top.length, group.media.length);
    for (let index = 0; index < count; index += 1) {
      const topItem = group.top[index];
      const mediaItem = group.media[index];
      if (topItem && mediaItem) result.push(mergeItem(topItem, mediaItem));
      else if (topItem || mediaItem) result.push(topItem || mediaItem);
    }
  }
  return result;
}

async function normalize(data, platform) {
  const items = collectResources(data);
  for (const item of items) {
    if (!item.url && item.content) item.url = await resolveResource(item.content);
  }
  const usable = items.filter((item) => item.url);
  const clean = (item) => ({
    quality: item.quality || null,
    format: item.format || null,
    size: item.size,
    url: item.url,
  });
  const sortItems = (a, b) => qualityRank(b.quality) - qualityRank(a.quality);
  const group = (type) => usable.filter((item) => item.type === type).map(clean).sort(sortItems);
  const published = Number(data.publish_ts) || 0;

  return {
    id: data.id || null,
    title: data.title || `${platform}_${data.id || Date.now()}`,
    author: {
      name: data.user_item?.nickname || null,
      id: data.user_item?.uid || null,
    },
    duration: Number(data.duration) || 0,
    thumbnail: data.thumbnail || null,
    stats: {
      likes: Number(data.like_count) || 0,
      comments: Number(data.comment_count) || 0,
      published_at: published ? new Date(published * 1000).toISOString() : null,
    },
    videos: group('video'),
    audios: group('audio'),
    images: group('image'),
  };
}

function detectPlatform(input) {
  const host = new URL(input).hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be' || host.endsWith('.youtube.com') || host === 'youtube.com') return 'youtube';
  if (host === 'instagr.am' || host.endsWith('.instagram.com') || host === 'instagram.com') return 'instagram';
  if (host === 'fb.watch' || host === 'fb.me' || host.endsWith('.facebook.com') || host === 'facebook.com') return 'facebook';
  if (host.endsWith('.tiktok.com') || host === 'tiktok.com') return 'tiktok';
  if (host === 'pin.it' || host.includes('pinterest.')) return 'pinterest';
  if (host === 'redd.it' || host.endsWith('.reddit.com') || host === 'reddit.com') return 'reddit';
  if (host.endsWith('.threads.com') || host === 'threads.com' || host.endsWith('.threads.net') || host === 'threads.net') return 'threads';
  if (host === 'dai.ly' || host.endsWith('.dailymotion.com') || host === 'dailymotion.com') return 'dailymotion';
  return null;
}

function usage() {
  return [
    'Usage: node scrape-aiov3.js "<url>" --<platform>',
    `Platforms: ${PLATFORM_FLAGS.join(', ')}`,
    'Without a platform flag the platform is detected from the URL.',
    'Writes normalized JSON to stdout and result.json in the current directory.',
  ].join('\n');
}

function parseArgs(argv) {
  let url = null;
  let platform = null;
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg.startsWith('--')) {
      const name = arg.slice(2).toLowerCase();
      if (name === 'auto') continue;
      if (!PLATFORM_FLAGS.includes(name)) throw new Error(`Unknown platform flag: ${arg}`);
      if (platform && platform !== name) throw new Error('Use only one platform flag');
      platform = name;
    } else if (!url) {
      url = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  if (!url) throw new Error('URL is required');
  return { url, platform };
}

async function run(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  let source;
  try {
    source = new URL(args.url);
  } catch {
    throw new Error('Invalid URL');
  }
  if (!['http:', 'https:'].includes(source.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported');

  const detected = detectPlatform(source.href);
  if (!detected) throw new Error('Unsupported platform');
  if (args.platform && args.platform !== detected) {
    throw new Error(`URL is ${detected}, not ${args.platform}`);
  }
  const platform = args.platform || detected;

  const payload = await call('/parse/link', { origin: 'source', link: source.href });
  if (payload.status !== undefined && payload.status !== 1) {
    throw new Error(errorMessage(payload) || 'parse/link failed');
  }
  if (!payload.data) throw new Error(errorMessage(payload) || 'No data returned');

  const data = await normalize(payload.data, platform);
  const result = { success: true, platform, url: source.href, data };
  const output = `${JSON.stringify(result, null, 2)}\n`;
  await writeFile('result.json', output);
  process.stdout.write(output);
  return 0;
}

try {
  const code = await run(process.argv.slice(2));
  if (code) process.exitCode = code;
} catch (error) {
  const args = process.argv.slice(2);
  const rawUrl = args.find((arg) => !arg.startsWith('-')) || null;
  let platform = args.find((arg) => PLATFORM_FLAGS.includes(arg.slice(2)))?.slice(2) || null;
  if (!platform && rawUrl) {
    try {
      platform = detectPlatform(rawUrl);
    } catch {
      platform = null;
    }
  }
  const result = {
    success: false,
    platform,
    url: rawUrl,
    error: { message: error.message || String(error) },
  };
  const output = `${JSON.stringify(result, null, 2)}\n`;
  try {
    await writeFile('result.json', output);
  } catch {}
  process.stdout.write(output);
  process.stderr.write(`${error.message || error}\n`);
  process.exitCode = 1;
}
