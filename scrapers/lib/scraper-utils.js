'use strict';

const { relative, sep } = require('node:path');
const { setTimeout: sleep } = require('node:timers/promises');

const USER_AGENT = 'KumpulanScraperv2/1.0 (+https://github.com/Lmavour/KumpulanScraperv2)';
const cache = new Map();
const nextRequest = new Map();
const cooldown = new Map();
const publicImageHosts = [
  'upload.wikimedia.org', 'placehold.co', 'avatars.githubusercontent.com',
  'i.ibb.co', 'i.imgur.com', 'images.pexels.com', 'images.unsplash.com'
];

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function text(value, name = 'Input', max = 300) {
  if (!hasText(value) || value.trim().length > max) {
    throw new Error(`${name} harus berupa teks sepanjang 1-${max} karakter`);
  }
  return value.trim();
}

function integer(value, fallback, min, max, name = 'Nilai') {
  const number = value === undefined ? fallback : Number(value);
  const validType = value === undefined || typeof value === 'number' || typeof value === 'string';
  if (!validType || (typeof value === 'string' && !value.trim()) || !Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${name} harus bilangan bulat antara ${min} dan ${max}`);
  }
  return number;
}

function choice(value, fallback, allowed, name = 'Mode') {
  const selected = value === undefined ? fallback : text(value, name).toLowerCase();
  if (!allowed.includes(selected)) throw new Error(`${name} harus salah satu: ${allowed.join(', ')}`);
  return selected;
}

function isoDate(value) {
  const date = text(value, 'Tanggal', 10);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('Tanggal harus valid dalam format YYYY-MM-DD');
  }
  return date;
}

function urlWithParams(base, params = {}) {
  const url = new URL(base);
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(name, String(item));
  }
  return url.href;
}

function httpsUrl(value, hosts) {
  if (typeof value !== 'string' || !/^https:\/\/[^/]/i.test(value) || /[\s\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.port || (hosts && !hosts.includes(url.hostname))) return null;
    return url;
  } catch { return null; }
}

function publicImageUrl(value) {
  return httpsUrl(value, publicImageHosts);
}

function imageData({ buffer, contentType }) {
  const matches = {
    'image/png': buffer.length >= 33 && buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a',
    'image/jpeg': buffer.length >= 12 && buffer.subarray(0, 3).toString('hex') === 'ffd8ff',
    'image/gif': buffer.length >= 13 && /^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6)),
    'image/webp': buffer.length >= 16 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  };
  return matches[contentType] === true ? { mimeType: contentType, base64: buffer.toString('base64') } : null;
}

function failure(source, error) {
  const result = { status: false, source, message: error.message || String(error) };
  const code = error.code || error.cause?.code;
  if (typeof code === 'string') result.errorCode = code;
  if (error.httpStatus) result.httpStatus = error.httpStatus;
  if (error.retryAfter !== undefined) result.retryAfter = error.retryAfter;
  return result;
}

function checkCooldown(origin) {
  const remaining = (cooldown.get(origin) || 0) - Date.now();
  if (remaining > 0) {
    const error = new Error(`HTTP 429: tunggu sebelum request berikutnya ke ${origin}`);
    error.httpStatus = 429;
    error.retryAfter = Math.ceil(remaining / 1000);
    throw error;
  }
}

async function request(url, options = {}) {
  const timeout = integer(options.timeout, 25000, 1, 120000, 'Timeout');
  const interval = options.interval ?? 250;
  const format = options.format || 'json';
  const binary = format === 'binary';
  const ttl = binary || options.cache === false ? 0 : (options.cacheTtl ?? 60000);
  const jsonBody = options.jsonBody === undefined ? undefined : JSON.stringify(options.jsonBody);
  const key = ttl > 0 ? JSON.stringify([format, url, jsonBody]) : null;
  const saved = key === null ? undefined : cache.get(key);
  if (saved && saved.expires > Date.now()) return format === 'json' ? JSON.parse(saved.body) : saved.body;

  // Reserve a slot synchronously so concurrent calls respect the same origin's pace.
  const origin = new URL(url).origin;
  checkCooldown(origin);
  const now = Date.now();
  const start = Math.max(now, nextRequest.get(origin) || 0);
  const wait = start - now;
  if (wait >= timeout) throw new Error('Layanan sedang dalam jeda request; coba lagi nanti');
  nextRequest.set(origin, start + interval);
  if (wait) await sleep(wait);
  checkCooldown(origin);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout - wait);
  try {
    const contact = options.contact ?? process.env.SCRAPER_CONTACT;
    const headers = {
      'User-Agent': contact ? `${USER_AGENT} (${text(contact, 'Kontak', 200)})` : USER_AGENT,
      Accept: format === 'json' ? 'application/json' : 'text/html,application/rss+xml,application/xml;q=0.9',
      ...(jsonBody === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers
    };
    if (contact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) headers.email = contact;
    const response = await fetch(url, {
      headers, signal: controller.signal,
      redirect: options.redirect ?? (jsonBody === undefined ? 'follow' : 'error'),
      ...(jsonBody === undefined ? {} : { method: 'POST', body: jsonBody })
    });
    if (!response.ok && !(options.allowNotFound === true && response.status === 404)) {
      const error = new Error(`HTTP ${response.status} dari ${origin}`);
      error.httpStatus = response.status;
      if (response.status === 429) {
        const raw = response.headers.get('retry-after');
        const delay = raw && /^\d+$/.test(raw) ? Number(raw) * 1000 : Date.parse(raw || '') - Date.now();
        error.retryAfter = Number.isFinite(delay) && delay > 0 ? Math.ceil(delay / 1000) : 60;
        cooldown.set(origin, Date.now() + error.retryAfter * 1000);
        nextRequest.set(origin, Math.max(nextRequest.get(origin) || 0, Date.now() + error.retryAfter * 1000));
      }
      if (response.body) await response.body.cancel();
      throw error;
    }

    if (!response.body) throw new Error(`Respons ${origin} tidak memiliki isi`);
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2 * 1024 * 1024) {
        await reader.cancel();
        throw new Error('Respons melebihi batas 2 MB');
      }
      chunks.push(Buffer.from(value));
    }
    const buffer = Buffer.concat(chunks);
    if (binary) {
      return { buffer, contentType: response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() ?? null };
    }
    const body = buffer.toString('utf8');
    let result = body;
    if (format === 'json') {
      try { result = JSON.parse(body); }
      catch { throw new Error(`Respons ${origin} bukan JSON valid`); }
    }
    if (key !== null && response.ok) {
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(key, { body, expires: Date.now() + ttl });
    }
    return result;
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`Request timeout setelah ${timeout} ms`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function runCLI(source, usage, handler, flags = [], booleanFlags = [], { allowEmpty = false } = {}) {
  const argv = process.argv.slice(2);
  const optionArgs = argv.includes('--') ? argv.slice(0, argv.indexOf('--')) : argv;
  if (optionArgs.includes('--help') || optionArgs.includes('-h')) {
    process.stdout.write(`${usage}\nOpsi umum: --timeout <ms>, --no-cache, --help\n`);
    return;
  }
  try {
    if (!allowEmpty && !argv.length) throw new Error(usage);
    const args = { _: [] };
    let positionalOnly = false;
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === '--' && !positionalOnly) { positionalOnly = true; continue; }
      if (!positionalOnly && arg === '--no-cache') { args.cache = false; continue; }
      if (!positionalOnly && arg.startsWith('--')) {
        const name = arg.slice(2);
        if (booleanFlags.includes(name)) { args[name] = true; continue; }
        if (!['timeout', 'limit', ...flags].includes(name)) throw new Error(`Opsi tidak dikenal: ${arg}`);
        const value = argv[++i];
        if (value === undefined || value.startsWith('--')) throw new Error(`${arg} membutuhkan nilai`);
        args[name] = value;
      } else args._.push(arg);
    }
    const result = await handler(args);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.status ? 0 : 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify(failure(source, error), null, 2)}\n`);
    process.exitCode = 1;
  }
}

function endpointModule(url, {
  source, params = {}, interval, timeout, cache = true,
  image = false,
  mapData = (data) => data,
  validateData = (data) => data !== null && typeof data === 'object'
}) {
  const endpoint = new URL(url).pathname.replace(/^\/(?:api\/)?/, '');
  const parameters = Object.entries(params);

  async function scrape(options = {}) {
    try {
      const { timeout: requestTimeout = timeout } = options;
      const query = {};
      for (const [name, rule] of parameters) {
        const value = options[name];
        if (value === undefined && !rule.required) continue;
        if (rule.type === 'https-url' || rule.type === 'image-url') {
          const input = text(value, name, rule.maxLength ?? 2000);
          const target = rule.type === 'image-url' ? publicImageUrl(input) : httpsUrl(input, rule.hosts);
          if (!target || (rule.path && !rule.path.test(target.pathname)) || (rule.validateUrl && !rule.validateUrl(target))) {
            throw new Error(`${name} harus berupa URL HTTPS untuk konten publik yang didukung`);
          }
          target.hash = '';
          if (!rule.queryKeys) target.search = '';
          else for (const key of new Set(target.searchParams.keys())) {
            if (!rule.queryKeys.includes(key)) target.searchParams.delete(key);
          }
          query[name] = target.href;
        } else if (rule.choices) {
          const selected = text(value, name).toLowerCase();
          const canonical = rule.choices.find((option) => option.toLowerCase() === selected);
          if (canonical === undefined) throw new Error(`${name} harus salah satu: ${rule.choices.join(', ')}`);
          query[name] = canonical;
        } else if (rule.type === 'number') {
          const number = typeof value === 'number' ? value : Number(text(value, name));
          if (!Number.isFinite(number) || number < rule.min || number > rule.max) {
            throw new Error(`${name} harus angka antara ${rule.min} dan ${rule.max}`);
          }
          query[name] = number;
        } else if (rule.min !== undefined) query[name] = integer(value, NaN, rule.min, rule.max, name);
        else {
          const input = text(value, name, rule.maxLength ?? 300);
          if (rule.pattern && !rule.pattern.test(input)) throw new Error(`${name} tidak sesuai format`);
          query[name] = rule.normalize ? rule.normalize(input) : input;
        }
      }
      const payload = await request(urlWithParams(url, query), {
        timeout: requestTimeout, interval, cache: cache && options.cache !== false, redirect: 'error',
        ...(image ? { format: 'binary', headers: { Accept: 'image/png, image/jpeg, image/gif, image/webp' } } : {})
      });
      const data = image ? imageData(payload) : payload?.status === true ? mapData(payload.data) : null;
      if (data == null || !validateData(data)) {
        throw new Error('Layanan tidak mengembalikan data yang valid');
      }
      return { status: true, source, endpoint, timestamp: image ? null : (payload.timestamp ?? null), data };
    } catch (error) { return failure(source, error); }
  }

  function cli() {
    const flags = parameters.map(([name, rule]) => {
      const value = rule.choices?.join('|') ?? (rule.type === 'image-url' ? 'URL gambar publik'
        : rule.type === 'https-url' ? 'URL HTTPS'
        : rule.min === undefined ? 'teks' : `${rule.min}-${rule.max}`);
      const flag = `--${name} <${value}>`;
      return rule.required ? flag : `[${flag}]`;
    });
    const script = relative(process.cwd(), process.argv[1]).split(sep).join('/');
    const command = /\s/.test(script) ? `"${script}"` : script;
    const usage = `Usage: node ${command}${flags.length ? ` ${flags.join(' ')}` : ''}\nEndpoint: ${endpoint}`;
    return runCLI(source, usage, (args) => {
      if (args._.length) throw new Error(usage);
      return scrape(args);
    }, parameters.map(([name]) => name), [], { allowEmpty: true });
  }

  return { scrape, cli };
}

function jsonEndpoint(url, options) {
  return endpointModule(url, options);
}

function imageEndpoint(url, options) {
  return endpointModule(url, { ...options, image: true });
}

module.exports = { request, text, hasText, integer, choice, isoDate, urlWithParams, httpsUrl, publicImageUrl, imageData, failure, runCLI, jsonEndpoint, imageEndpoint };
