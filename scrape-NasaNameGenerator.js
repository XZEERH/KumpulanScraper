/**
 * Name : scrape-nasaNameGenerator
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps : https://nasanamegenerator(.)com/
 * Type : Scraper/JSON
 * Method : GET/POST
 * Description : Mengubah nama menjadi ubin surat Landsat NASA dengan detail lokasi dan URL gambar/base64.
 * Note : Ya gitulah intinya, bagi yang mau aja, btw Error fix sendiri.
 **/

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE_URL = 'https://nasanamegenerator.com';
const HOME_URL = `${BASE_URL}/`;
const MAX_NAME_LENGTH = 18;
const REQUEST_TIMEOUT = 20000;
const ENGINE_TTL = 60 * 60 * 1000;

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

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

let engineCache = null;
let engineCachedAt = 0;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requestHeaders(accept) {
  return {
    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    Accept: accept ?? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: HOME_URL,
  };
}

async function request(url, { binary = false, accept, attempts = 2 } = {}) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: requestHeaders(accept),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      if (!res.ok) {
        throw httpError(res.status, `HTTP ${res.status} ${HTTP_STATUS[res.status] ?? 'Unknown'}`);
      }

      return binary
        ? {
            buffer: Buffer.from(await res.arrayBuffer()),
            type: res.headers.get('content-type') || 'image/webp',
          }
        : await res.text();
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await sleep(600);
    }
  }

  throw lastError;
}

function parseEngine(html) {
  const serialized = html.match(/const letterDataSerialized = "((?:[^"\\]|\\.)*)";/);
  if (!serialized) throw new Error('Landsat letterData not found on homepage');

  const data = JSON.parse(JSON.parse(`"${serialized[1]}"`));
  const rawBase = html.match(/const imagesBasePath = "([^"]+)"/)?.[1] || '/images/letters';
  const imageBase = rawBase.startsWith('http')
    ? rawBase.replace(/\/$/, '')
    : `${BASE_URL}${rawBase.startsWith('/') ? '' : '/'}${rawBase.replace(/\/$/, '')}`;

  let rawPools = {};
  const poolBlock = html.match(
    /function createLetterArrays\(\)\s*\{\s*return\s*\{([\s\S]*?)\};\s*\}/,
  );

  if (poolBlock) {
    try {
      rawPools = JSON.parse(`{${poolBlock[1].replace(/([A-Z])\s*:/g, '"$1":')}}`);
    } catch {
      rawPools = {};
    }
  }

  const pools = {};
  for (const letter of Object.keys(data)) {
    const declared = rawPools[letter.toUpperCase()];
    const indexes = Array.isArray(declared)
      ? declared.filter((index) => Number.isInteger(index) && data[letter][index])
      : data[letter].map((_, index) => index);

    pools[letter] = indexes;
  }

  return { data, pools, imageBase };
}

async function loadEngine() {
  if (engineCache && Date.now() - engineCachedAt < ENGINE_TTL) return engineCache;

  try {
    const engine = parseEngine(await request(HOME_URL));
    engineCache = engine;
    engineCachedAt = Date.now();
    return engine;
  } catch (error) {
    if (engineCache) return engineCache;
    throw error;
  }
}

function pickIndex(letter, engine, used) {
  const pool = engine.pools[letter] ?? [];
  if (!pool.length) return null;

  let candidates = pool.filter((index) => !used.has(`${letter}_${index}`));
  if (!candidates.length) candidates = pool;

  const index = candidates[Math.floor(Math.random() * candidates.length)];
  used.add(`${letter}_${index}`);
  return index;
}

function cleanLink(url) {
  return !url || url === 'https://none.com' ? null : url;
}

function buildMapsUrl(entry) {
  if (entry.maps && entry.maps !== 'https://maps.google.com') return entry.maps;
  if (!entry.coordinates) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.coordinates)}`;
}

/**
 * Build Landsat tiles for a name.
 * @param {string} rawName Letters A-Z and spaces, max 18 characters.
 * @param {{mode?: 'url' | 'base64'}} [options] 'url' for GET-style links, 'base64' for inline data URIs.
 * @returns {Promise<[object, {data: object[]}]>} Standard two-object scraper response.
 */
export async function nasaNameGenerator(rawName, options = {}) {
  const mode = options.mode === 'url' ? 'url' : 'base64';

  try {
    if (typeof rawName !== 'string') throw httpError(400, 'Name must be a string');

    const name = rawName.trim();
    if (!name) throw httpError(400, 'Name is required');
    if (name.length > MAX_NAME_LENGTH) {
      throw httpError(400, `Name must be ${MAX_NAME_LENGTH} characters or fewer`);
    }
    if (!/^[A-Za-z ]+$/.test(name)) {
      throw httpError(400, 'Name may only contain letters A-Z and spaces');
    }
    if (!name.replace(/\s/g, '').length) {
      throw httpError(400, 'Name must contain at least one letter');
    }

    const engine = await loadEngine();
    const used = new Set();
    const tiles = [];
    let position = 0;

    for (const char of name) {
      position += 1;
      if (char === ' ') continue;

      const letter = char.toLowerCase();
      const index = pickIndex(letter, engine, used);
      if (index === null) continue;

      const meta = engine.data[letter]?.[index] ?? {};
      tiles.push({
        position,
        char: char.toUpperCase(),
        tile: `${letter}_${index}`,
        location: meta.location ?? null,
        coordinates: meta.coordinates ?? null,
        link: cleanLink(meta.link),
        maps: buildMapsUrl(meta),
        url: `${engine.imageBase}/letter_${letter}_${index}.webp`,
        image: null,
      });
    }

    if (!tiles.length) throw httpError(404, 'No Landsat tile available for this name');

    const failedImages = [];

    if (mode === 'base64') {
      await Promise.all(
        tiles.map(async (tile) => {
          try {
            const { buffer, type } = await request(tile.url, {
              binary: true,
              accept: 'image/webp,image/*,*/*;q=0.8',
            });
            tile.image = `data:${type};base64,${buffer.toString('base64')}`;
          } catch {
            tile.image = tile.url;
            failedImages.push(tile.tile);
          }
        }),
      );
    } else {
      for (const tile of tiles) tile.image = tile.url;
    }

    const sequence = tiles.map((tile) => tile.tile.split('_')[1]).join('');
    const shareUrl = `${BASE_URL}/${encodeURIComponent(name)}${sequence ? `?v=${sequence}` : ''}`;

    return [
      {
        status: 200,
        response: 'OK',
        name,
        mode,
        totalTiles: tiles.length,
        shareUrl,
        generatedAt: new Date().toISOString(),
        ...(failedImages.length ? { failedImages } : {}),
      },
      {
        data: tiles,
      },
    ];
  } catch (error) {
    const status = error.status >= 400 && error.status < 600 ? error.status : 500;
    const response = HTTP_STATUS[status] ?? 'Unknown';

    return [
      {
        status,
        response,
        error: `ERROR ${status} ${response}: ${error.message}`,
      },
      {
        data: [],
      },
    ];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const outFlag = args.find((arg) => arg.startsWith('--out='));
  const name = args.filter((arg) => !arg.startsWith('--')).join(' ');

  if (!name || flags.has('--help')) {
    console.log('Usage: node scrape-nasaNameGenerator.js "Name" [--url] [--out=result.json]');
    process.exitCode = name ? 0 : 1;
    return;
  }

  const mode = flags.has('--url') ? 'url' : 'base64';
  const result = await nasaNameGenerator(name, { mode });
  const outPath = resolve(outFlag ? outFlag.slice(6) : 'result.json');

  await writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`);

  const [meta, payload] = result;
  console.log(`[${meta.status} ${meta.response}] ${meta.name ?? name} - ${payload.data.length} tile(s)`);
  if (meta.shareUrl) console.log(`Share: ${meta.shareUrl}`);
  if (meta.error) console.error(meta.error);
  console.log(`Saved: ${outPath}`);

  if (meta.status !== 200) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
