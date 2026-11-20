/**
 * Name: rip-linkvertise-bypass
 * Creator: Razeerh
 * Source: https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps: https://rip.linkvertise.lol/
 * Type: Scraper/JSON
 * Description: Menyelesaikan tautan Linkvertise, Work.ink, Lootlabs, LockR, dan AdMaven melalui penyelesai RIP.LINKVERTISE.LOL 
 * Note: Node.js murni. Mengbypass kerja Royal-Guard secara otomatis. Btw udah dilakukan pengujian dengan link yang tersedia. Harusnya work lah ya, btw error fix sendiri.
 **/

import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://rip.linkvertise.lol';
const API_BASE = 'https://api.linkvertise.lol';
const ENGINE_NAME = 'RIP Resolver';
const ENGINE_VERSION = '1.0.0';
const SCRAPER_VERSION = '1.0.0';

const DEFAULT_TIMEOUT = 90_000;
const PROBE_TIMEOUT = 15_000;
const MAX_REDIRECTS = 6;
const MAX_API_REDIRECTS = 8;
const MAX_BODY_BYTES = 512 * 1024;
const MAX_API_ATTEMPTS = 2;
const BATCH_DELAY_MIN = 1_200;
const BATCH_DELAY_MAX = 2_600;

const HTTP_STATUS = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  408: 'Request Timeout',
  410: 'Gone',
  425: 'Too Early',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

const PLATFORMS = [
  {
    id: 'linkvertise',
    name: 'Linkvertise',
    domain: 'linkvertise.com',
    aliases: [
      'linkvertise.com',
      'linkvertise.net',
      'linkvertise.download',
      'link-to.net',
      'link-center.net',
      'link-hub.net',
      'link-target.net',
      'link-spot.net',
      'up-to-down.net',
      'direct-link.net',
      'filemedia.net',
      'file-link.net',
    ],
    category: 'advertising',
    support_status: 'supported',
    default_network_status: 'working',
    description: 'Link monetization and advertising network for exclusive content and downloads.',
  },
  {
    id: 'workink',
    name: 'Work.ink',
    domain: 'work.ink',
    aliases: ['work.ink', 'workink.net'],
    category: 'advertising',
    support_status: 'supported',
    default_network_status: 'working',
    description: 'Link monetization service with a short multi-step unlock flow.',
  },
  {
    id: 'lootlabs',
    name: 'Lootlabs',
    domain: 'lootlabs.gg',
    aliases: ['lootlabs.gg', 'loot-link.com', 'lootdest.org'],
    category: 'gaming-advertising',
    support_status: 'supported',
    default_network_status: 'working',
    description: 'Gaming-focused ad-tech and content locker platform.',
  },
  {
    id: 'lockr',
    name: 'LockR',
    domain: 'lockr.so',
    aliases: ['lockr.so', 'lockr.net'],
    category: 'content-locker',
    support_status: 'supported',
    default_network_status: 'working',
    description: 'Content locker with a short unlock task flow.',
  },
  {
    id: 'admaven',
    name: 'AdMaven',
    domain: 'free-content.pro',
    aliases: ['free-content.pro', 'free-content.net', 'admaven.com', 'admaven.co'],
    category: 'advertising',
    support_status: 'partial',
    default_network_status: 'partial',
    description: 'Ad network and content locker with rotating campaign domains. Support is partial.',
  },
];

class AppError extends Error {
  constructor(details) {
    super(details.message);
    this.name = 'AppError';
    this.details = details;
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomHex = (bytes = 6) => crypto.randomBytes(bytes).toString('hex');
const randomId = (prefix, bytes = 6) => `${prefix}_${randomHex(bytes)}`;
const pickUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const getStatusText = (status) => HTTP_STATUS[status] ?? 'Unknown';

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';

function nowIso(date = new Date()) {
  const pad = (value) => String(Math.abs(value)).padStart(2, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(hours)}:${pad(minutes)}`;
}

function emit(options, level, message, extra = {}) {
  if (typeof options?.onLog !== 'function') return;
  try {
    options.onLog({ level, message, ...extra });
  } catch {
    // Logger failures must never break the scraper.
  }
}

function isRedirect(status) {
  return [301, 302, 303, 307, 308].includes(status);
}

function isHtmlType(contentType) {
  const type = String(contentType || '').toLowerCase();
  return type.includes('text/html') || type.includes('application/xhtml+xml');
}

function isTextType(contentType) {
  const type = String(contentType || '').toLowerCase();
  return (
    type.startsWith('text/') ||
    type.includes('application/json') ||
    type.includes('application/xml') ||
    type.includes('+json') ||
    type.includes('+xml') ||
    type.includes('application/xhtml+xml')
  );
}

function isPrivateHost(hostname) {
  const host = String(hostname || '')
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/^\[|\]$/g, '');

  if (!host || host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;

  if (host.includes(':')) {
    if (host === '::' || host === '::1') return true;
    if (/^f[cd][0-9a-f]{2}:/.test(host)) return true;
    if (/^fe[89ab][0-9a-f]:/.test(host)) return true;
    if (host.startsWith('::ffff:')) return isPrivateHost(host.slice(7));
    return false;
  }

  const parts = host.split('.');
  if (parts.length !== 4 || !parts.every((part) => /^\d{1,3}$/.test(part))) return false;

  const octets = parts.map(Number);
  if (octets.some((value) => value > 255)) return false;

  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateUrl(value) {
  try {
    return isPrivateHost(new URL(value).hostname);
  } catch {
    return true;
  }
}

function normalizeInput(input) {
  if (typeof input !== 'string') {
    throw new Error('URL must be a string');
  }

  let raw = input.trim();
  if (!raw) throw new Error('URL is empty');

  if (raw.startsWith('//')) raw = `https:${raw}`;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported protocol: ${url.protocol}`);
  }
  if (!url.hostname) throw new Error('URL has no hostname');

  url.hostname = url.hostname.toLowerCase();

  return {
    input: input.trim(),
    url,
    normalized: url.toString(),
    domain: url.hostname,
  };
}

export function detectPlatform(normalizedUrl) {
  let url;
  try {
    url = new URL(normalizedUrl);
  } catch {
    return {
      name: null,
      id: null,
      domain: null,
      alias: null,
      aliases: [],
      category: 'unknown',
      detection_method: 'domain',
      detection_status: 'failed',
      support_status: 'unknown',
      network_status: 'unknown',
      description: null,
    };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  for (const platform of PLATFORMS) {
    const alias = platform.aliases.find((item) => host === item || host.endsWith(`.${item}`));
    if (!alias) continue;

    return {
      name: platform.name,
      id: platform.id,
      domain: platform.domain,
      alias,
      aliases: [...platform.aliases],
      category: platform.category,
      detection_method: 'domain',
      detection_status: 'success',
      support_status: platform.support_status,
      network_status: platform.default_network_status,
      description: platform.description,
    };
  }

  return {
    name: host,
    id: slugify(host),
    domain: host,
    alias: host,
    aliases: [host],
    category: 'unknown',
    detection_method: 'fallback',
    detection_status: 'failed',
    support_status: 'unknown',
    network_status: 'unknown',
    description: null,
  };
}

function cleanText(value, maxLength = 2000) {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function resolveUrl(value, base) {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return cleanText(value, 2000);
  }
}

function extractMetadata(html, baseUrl) {
  const empty = {
    page_title: null,
    page_description: null,
    canonical_url: null,
    og_title: null,
    og_description: null,
    og_image: null,
    page_language: null,
  };

  if (!html) return empty;

  try {
    const $ = cheerio.load(html);
    const meta = (selector) => cleanText($(selector).first().attr('content'));

    const title = cleanText($('title').first().text(), 500);
    const ogTitle = meta('meta[property="og:title"]') || meta('meta[name="og:title"]');
    const description =
      meta('meta[name="description"]') ||
      meta('meta[property="og:description"]') ||
      meta('meta[name="twitter:description"]');
    const ogDescription = meta('meta[property="og:description"]');
    const canonical = resolveUrl($('link[rel="canonical"]').first().attr('href'), baseUrl);
    const ogImage = resolveUrl(meta('meta[property="og:image"]'), baseUrl);
    const language =
      cleanText($('html').first().attr('lang'), 50) ||
      meta('meta[http-equiv="content-language"]');

    return {
      page_title: title || ogTitle || null,
      page_description: description || null,
      canonical_url: canonical || null,
      og_title: ogTitle || null,
      og_description: ogDescription || null,
      og_image: ogImage || null,
      page_language: language || null,
    };
  } catch {
    return empty;
  }
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    const list = headers.getSetCookie();
    if (Array.isArray(list) && list.length > 0) return list;
  }

  const raw = headers.get('set-cookie');
  if (!raw) return [];

  return raw.split(/,(?=\s*[!#$%&'*+\-.^_`|~0-9A-Za-z]+=)/g);
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  header() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  absorb(headers) {
    for (const raw of getSetCookies(headers)) {
      const first = String(raw).split(';')[0];
      const index = first.indexOf('=');
      if (index <= 0) continue;

      const name = first.slice(0, index).trim();
      const value = first.slice(index + 1).trim();
      if (!name) continue;

      if (!value) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
}

async function withTimeout(timeoutMs, task) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function cancelBody(response) {
  try {
    if (response?.body) await response.body.cancel();
  } catch {
    // The body may already be closed.
  }
}

async function readBodyLimited(response, maxBytes = MAX_BODY_BYTES) {
  if (!response?.body) return { text: '', bytes: 0, truncated: false };

  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  let truncated = false;

  try {
    while (bytes < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;

      const buffer = Buffer.from(value);
      const remaining = maxBytes - bytes;

      if (buffer.length > remaining) {
        chunks.push(buffer.subarray(0, remaining));
        bytes += remaining;
        truncated = true;
        try {
          await reader.cancel();
        } catch {
          // Ignore cancellation failures.
        }
        break;
      }

      chunks.push(buffer);
      bytes += buffer.length;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignore release failures.
    }
  }

  return {
    text: Buffer.concat(chunks).toString('utf8'),
    bytes,
    truncated,
  };
}

function requestHeaders(userAgent) {
  return {
    'User-Agent': userAgent,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  };
}

async function probeUrl(startUrl, options = {}) {
  const timeoutMs = options.timeoutMs ?? PROBE_TIMEOUT;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const userAgent = options.userAgent || pickUserAgent();
  const started = performance.now();
  const hops = [];

  let currentUrl = startUrl;
  let lastBody = '';
  let lastContentType = null;
  let limitReached = false;
  let completed = false;

  for (let index = 0; index <= maxRedirects; index += 1) {
    if (isPrivateUrl(currentUrl)) {
      throw new Error(`Private or local host blocked: ${new URL(currentUrl).hostname}`);
    }

    const hopStarted = performance.now();
    let result;

    try {
      result = await withTimeout(timeoutMs, async (signal) => {
        const response = await fetch(currentUrl, {
          redirect: 'manual',
          headers: requestHeaders(userAgent),
          signal,
        });

        const contentType = response.headers.get('content-type') || '';
        const location = response.headers.get('location');
        const redirect = isRedirect(response.status);
        const contentLength = Number(response.headers.get('content-length') || 0);
        let text = '';
        let bytes = 0;
        let truncated = false;
        let bodyRead = false;

        if (!redirect && isTextType(contentType)) {
          const body = await readBodyLimited(response, MAX_BODY_BYTES);
          text = body.text;
          bytes = body.bytes;
          truncated = body.truncated;
          bodyRead = true;
        } else {
          bytes = Number.isFinite(contentLength) ? contentLength : 0;
          await cancelBody(response);
        }

        return {
          response,
          contentType,
          location,
          redirect,
          text,
          bytes,
          truncated,
          bodyRead,
        };
      });
    } catch (error) {
      const duration = Math.round(performance.now() - hopStarted);
      const reason =
        error?.name === 'AbortError'
          ? `Request timed out after ${timeoutMs}ms`
          : error?.cause?.message || error?.message || 'Request failed';

      hops.push({
        step: hops.length + 1,
        url: currentUrl,
        status_code: null,
        status: null,
        method: 'GET',
        duration,
        timestamp: nowIso(),
        content_type: null,
        size: null,
        content_length: null,
        body_read: false,
        location: null,
        server: null,
        cache_control: null,
        retry_after: null,
        error: reason,
        type: hops.length === 0 ? 'source' : 'source-redirect',
      });
      break;
    }

    const duration = Math.round(performance.now() - hopStarted);
    let nextUrl = null;

    if (result.location) {
      try {
        nextUrl = new URL(result.location, currentUrl).toString();
      } catch {
        nextUrl = null;
      }
    }

    hops.push({
      step: hops.length + 1,
      url: currentUrl,
      status_code: result.response.status,
      status: getStatusText(result.response.status),
      method: 'GET',
      duration,
      timestamp: nowIso(),
      content_type: result.contentType || null,
      size: result.bodyRead ? result.bytes : null,
      content_length: Number(result.response.headers.get('content-length') || 0) || null,
      body_read: result.bodyRead,
      location: nextUrl,
      server: result.response.headers.get('server') || null,
      cache_control: result.response.headers.get('cache-control') || null,
      retry_after: result.response.headers.get('retry-after') || null,
      type: hops.length === 0 ? 'source' : 'source-redirect',
    });

    lastContentType = result.contentType;
    lastBody = result.text;

    if (result.redirect && nextUrl && index < maxRedirects) {
      currentUrl = nextUrl;
      continue;
    }

    if (result.redirect && index >= maxRedirects) {
      limitReached = true;
      break;
    }

    completed = true;
    break;
  }

  const finalHop = hops[hops.length - 1] || null;
  const metadata =
    lastBody && isHtmlType(lastContentType)
      ? extractMetadata(lastBody, finalHop?.url || startUrl)
      : extractMetadata('', startUrl);

  return {
    hops,
    finalUrl: finalHop?.url || startUrl,
    finalStatus: finalHop?.status_code ?? null,
    finalStatusText: finalHop?.status ?? null,
    finalContentType: lastContentType,
    finalBody: lastBody,
    metadata,
    completed,
    limitReached,
    totalTime: Math.round(performance.now() - started),
  };
}

function solveProofOfWork(spec, options = {}) {
  const prefix = String(spec?.prefix || '');
  if (!prefix) throw new Error('Royal-Guard challenge has no prefix');

  const parsedDifficulty = Number.parseFloat(spec?.diff);
  const difficulty =
    Number.isFinite(parsedDifficulty) && parsedDifficulty > 0 ? parsedDifficulty : 4.5;
  const bits = Math.round(difficulty * 4);
  const width = Math.ceil(bits / 4);
  const spare = width * 4 - bits;
  const deadline = options.deadline ?? null;

  const matches = (hex) => {
    let value = Number.parseInt(hex.slice(0, width), 16);
    if (spare) value >>>= spare;
    return value === 0;
  };

  const started = Date.now();
  let nonce = 0;

  for (;;) {
    if (deadline && (nonce & 0x3fff) === 0 && Date.now() >= deadline) {
      throw new Error('Royal-Guard proof-of-work timed out');
    }

    const hex = crypto
      .createHash('sha256')
      .update(`${prefix}:${nonce}`, 'utf8')
      .digest('hex');

    if (matches(hex)) {
      return {
        nonce,
        difficulty,
        bits,
        solve_time: Date.now() - started,
        hash: hex,
      };
    }

    nonce += 1;
    if (nonce > 20_000_000) {
      throw new Error('Royal-Guard proof-of-work nonce limit exceeded');
    }
  }
}

function extractChallenge(html) {
  const specMatch = html.match(
    /<script id="rg-pow" type="application\/json">([\s\S]*?)<\/script>/i,
  );
  const csrfMatch = html.match(/name="rg_csrf" value="([^"]+)"/i);
  if (!specMatch || !csrfMatch) return null;

  let spec;
  try {
    spec = JSON.parse(specMatch[1]);
  } catch {
    return null;
  }

  if (!spec?.prefix) return null;
  return { spec, csrf: csrfMatch[1] };
}

class EngineSession {
  constructor(options = {}) {
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.verbose = options.verbose !== false;
    this.userAgent = options.userAgent || pickUserAgent();
    this.jar = new CookieJar();
    this.lastChallenge = null;
    this.challengeCount = 0;
    this.handler = null;
    this.transport = null;
  }

  headers(extra = {}) {
    const cookie = this.jar.header();
    return {
      'User-Agent': this.userAgent,
      'Accept-Language': 'en-US,en;q=0.9',
      Origin: API_BASE,
      Referer: `${SITE_URL}/`,
      ...(cookie ? { Cookie: cookie } : {}),
      ...extra,
    };
  }
}

function createEngineUrl(targetUrl, options = {}) {
  const url = new URL('/backend/bypass', API_BASE);
  url.searchParams.set('url', targetUrl);
  if (options.verbose !== false) url.searchParams.set('verbose', 'true');
  if (options.fresh) {
    url.searchParams.set('refresh', 'true');
    url.searchParams.set('iv', crypto.randomUUID());
  }
  return url.toString();
}

async function readSseStream(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events = [];
  let buffer = '';
  let bytes = 0;
  let result = null;
  let error = null;
  let lastEventAt = performance.now();

  const processLine = (rawLine) => {
    let line = rawLine;
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (!line || line.startsWith(':')) return;

    if (line.startsWith('event:')) return;
    if (!line.startsWith('data:')) return;

    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') return;

    let data;
    try {
      data = JSON.parse(payload);
    } catch {
      return;
    }

    const eventAt = performance.now();
    const duration = Math.round(eventAt - lastEventAt);
    lastEventAt = eventAt;

    events.push(data);
    if (typeof onEvent === 'function') {
      try {
        onEvent(data, duration);
      } catch {
        // Event handlers must never break the stream.
      }
    }

    if (data?.status === 'success' && data?.success !== false && data?.result) {
      result = String(data.result).trim();
    } else if (data?.status === 'error') {
      error = String(data.result || data.message || 'Bypass failed').trim();
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytes += value.byteLength;
      buffer += decoder.decode(value, { stream: true });

      let newline;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        processLine(line);
      }
    }

    buffer += decoder.decode();
    if (buffer) {
      for (const line of buffer.split('\n')) processLine(line);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignore release failures.
    }
  }

  return { events, result, error, bytes };
}

function makeEngineError(code, message, details = {}) {
  return {
    code,
    type: details.type || 'engine',
    message,
    diagnostic_message: details.diagnostic_message || message,
    retryable: Boolean(details.retryable),
  };
}

async function callEngineOnce(session, targetUrl, options = {}) {
  const apiUrl = createEngineUrl(targetUrl, {
    fresh: options.fresh,
    verbose: session.verbose,
  });

  session.transport = null;
  session.handler = null;

  const controller = new AbortController();
  const deadline = Date.now() + session.timeout;
  const timer = setTimeout(() => controller.abort(), session.timeout);
  const requestStarted = performance.now();

  let response = null;
  let finalUrl = apiUrl;
  let finalContentType = null;
  let finalStatus = null;
  let finalStatusText = null;
  let cached = false;
  let events = [];
  let result = null;
  let streamError = null;
  let responseBytes = 0;

  const onEvent = options.onEvent;

  try {
    for (let hop = 0; hop <= MAX_API_REDIRECTS; hop += 1) {
      const requestTime = performance.now();
      response = await fetch(finalUrl, {
        redirect: 'manual',
        signal: controller.signal,
        headers: session.headers({
          Accept: 'text/html,application/xhtml+xml,text/event-stream,application/json;q=0.9,*/*;q=0.8',
          Referer: `${SITE_URL}/`,
        }),
      });

      session.jar.absorb(response.headers);
      const contentType = response.headers.get('content-type') || '';
      const location = response.headers.get('location');

      if (isRedirect(response.status)) {
        if (!location) {
          await cancelBody(response);
          return {
            ok: false,
            error: makeEngineError('HTTP_ERROR', 'Resolver returned a redirect without a location', {
              type: 'http',
              diagnostic_message: `HTTP ${response.status} without Location header`,
            }),
            transport: session.transport,
            events,
            attempts: 1,
          };
        }

        let nextUrl;
        try {
          nextUrl = new URL(location, finalUrl).toString();
        } catch {
          nextUrl = null;
        }

        await cancelBody(response);
        if (!nextUrl) {
          return {
            ok: false,
            error: makeEngineError('HTTP_ERROR', 'Resolver returned an invalid redirect location', {
              type: 'http',
              diagnostic_message: location,
            }),
            transport: session.transport,
            events,
            attempts: 1,
          };
        }

        finalUrl = nextUrl;
        continue;
      }

      finalStatus = response.status;
      finalStatusText = response.statusText;
      finalContentType = contentType;

      if (response.status === 429 || response.status >= 500) {
        const body = await readBodyLimited(response, 64 * 1024);
        const retryAfter = response.headers.get('retry-after');
        session.transport = {
          request_method: 'GET',
          request_url: apiUrl,
          response_status: response.status,
          response_message: getStatusText(response.status),
          response_content_type: contentType || null,
          response_size: body.bytes,
          response_time: Math.round(performance.now() - requestTime),
          response_location: null,
          cache_control: response.headers.get('cache-control') || null,
          server: response.headers.get('server') || null,
          retry_after: retryAfter,
          cf_cache_status: response.headers.get('cf-cache-status') || null,
          cf_ray: response.headers.get('cf-ray') || null,
          cached: false,
        };
        return {
          ok: false,
          error: makeEngineError(
            `HTTP_${response.status}`,
            `Resolver returned HTTP ${response.status} ${getStatusText(response.status)}`,
            {
              type: 'http',
              diagnostic_message: cleanText(body.text, 500) || undefined,
              retryable: response.status === 429 || response.status >= 500,
            },
          ),
          transport: session.transport,
          events,
          attempts: 1,
        };
      }

      if (response.status === 403) {
        const body = await readBodyLimited(response, 128 * 1024);
        const title = extractMetadata(body.text, apiUrl).page_title;
        session.transport = {
          request_method: 'GET',
          request_url: apiUrl,
          response_status: response.status,
          response_message: getStatusText(response.status),
          response_content_type: contentType || null,
          response_size: body.bytes,
          response_time: Math.round(performance.now() - requestTime),
          response_location: null,
          cache_control: response.headers.get('cache-control') || null,
          server: response.headers.get('server') || null,
          retry_after: response.headers.get('retry-after') || null,
          cf_cache_status: response.headers.get('cf-cache-status') || null,
          cf_ray: response.headers.get('cf-ray') || null,
          cached: false,
        };
        return {
          ok: false,
          error: makeEngineError('HTTP_403', 'Resolver access was forbidden', {
            type: 'http',
            diagnostic_message: title || cleanText(body.text, 300) || 'HTTP 403 Forbidden',
          }),
          transport: session.transport,
          events,
          attempts: 1,
        };
      }

      if (response.status !== 200) {
        const body = await readBodyLimited(response, 64 * 1024);
        return {
          ok: false,
          error: makeEngineError(
            'HTTP_ERROR',
            `Unexpected resolver status: HTTP ${response.status}`,
            {
              type: 'http',
              diagnostic_message: cleanText(body.text, 300) || getStatusText(response.status),
            },
          ),
          transport: session.transport,
          events,
          attempts: 1,
        };
      }

      if (contentType.includes('text/event-stream')) {
        const stream = await readSseStream(response, onEvent);
        events = stream.events;
        result = stream.result;
        streamError = stream.error;
        responseBytes = stream.bytes;
        session.transport = {
          request_method: 'GET',
          request_url: apiUrl,
          response_status: response.status,
          response_message: getStatusText(response.status),
          response_content_type: contentType,
          response_size: responseBytes,
          response_time: Math.round(performance.now() - requestTime),
          response_location: null,
          cache_control: response.headers.get('cache-control') || null,
          server: response.headers.get('server') || null,
          retry_after: response.headers.get('retry-after') || null,
          cf_cache_status: response.headers.get('cf-cache-status') || null,
          cf_ray: response.headers.get('cf-ray') || null,
          cached: false,
          stream: true,
        };

        if (result) {
          return {
            ok: true,
            result,
            cached: false,
            events,
            transport: session.transport,
            attempts: 1,
          };
        }

        if (streamError) {
          return {
            ok: false,
            error: classifyBypassError(streamError),
            transport: session.transport,
            events,
            attempts: 1,
          };
        }

        return {
          ok: false,
          error: makeEngineError(
            'EMPTY_RESULT',
            'Resolver stream closed before a destination was returned',
            {
              type: 'engine',
              diagnostic_message: 'SSE stream ended without a success or error event',
              retryable: true,
            },
          ),
          transport: session.transport,
          events,
          attempts: 1,
        };
      }

      if (contentType.includes('application/json')) {
        const body = await readBodyLimited(response, 256 * 1024);
        responseBytes = body.bytes;
        let data;
        try {
          data = JSON.parse(body.text);
        } catch {
          data = null;
        }

        session.transport = {
          request_method: 'GET',
          request_url: apiUrl,
          response_status: response.status,
          response_message: getStatusText(response.status),
          response_content_type: contentType,
          response_size: responseBytes,
          response_time: Math.round(performance.now() - requestTime),
          response_location: null,
          cache_control: response.headers.get('cache-control') || null,
          server: response.headers.get('server') || null,
          retry_after: response.headers.get('retry-after') || null,
          cf_cache_status: response.headers.get('cf-cache-status') || null,
          cf_ray: response.headers.get('cf-ray') || null,
          cached: true,
          stream: false,
        };

        if (data?.success === true && data?.result) {
          cached = true;
          return {
            ok: true,
            result: String(data.result).trim(),
            cached,
            events,
            transport: session.transport,
            attempts: 1,
          };
        }

        if (data?.success === false || data?.result) {
          const message = String(data.result || data.message || 'Bypass failed');
          return {
            ok: false,
            error: classifyBypassError(message),
            transport: session.transport,
            events,
            attempts: 1,
          };
        }

        return {
          ok: false,
          error: makeEngineError('EMPTY_RESULT', 'Resolver returned an empty JSON response', {
            type: 'engine',
            diagnostic_message: cleanText(body.text, 300) || 'Empty JSON object',
          }),
          transport: session.transport,
          events,
          attempts: 1,
        };
      }

      if (contentType.includes('text/html')) {
        const body = await readBodyLimited(response, 1024 * 1024);
        responseBytes = body.bytes;
        const challenge = extractChallenge(body.text);

        if (challenge) {
          const typed = solveProofOfWork(challenge.spec, { deadline });
          session.challengeCount += 1;
          session.lastChallenge = {
            type: 'sha256-pow',
            difficulty: typed.difficulty,
            bits: typed.bits,
            nonce: typed.nonce,
            solve_time: typed.solve_time,
            solved_at: nowIso(),
          };

          emit(options, 'info', `Royal-Guard solved (${typed.solve_time}ms, nonce ${typed.nonce})`);

          const form = new URLSearchParams({
            rg_pow_prefix: String(challenge.spec.prefix),
            rg_pow_exp: String(challenge.spec.exp),
            rg_pow_diff: String(typed.difficulty),
            rg_pow_sig: String(challenge.spec.sig || ''),
            rg_pow_nonce: String(typed.nonce),
            rg_csrf: challenge.csrf,
          });

          const postResponse = await fetch(apiUrl, {
            method: 'POST',
            redirect: 'manual',
            signal: controller.signal,
            headers: session.headers({
              Accept: 'text/html,text/event-stream,application/json;q=0.9,*/*;q=0.8',
              'Content-Type': 'application/x-www-form-urlencoded',
              Referer: apiUrl,
            }),
            body: form.toString(),
          });

          session.jar.absorb(postResponse.headers);
          const postLocation = postResponse.headers.get('location');

          if (isRedirect(postResponse.status) && postLocation) {
            let nextUrl;
            try {
              nextUrl = new URL(postLocation, apiUrl).toString();
            } catch {
              nextUrl = null;
            }
            await cancelBody(postResponse);

            if (!nextUrl) {
              return {
                ok: false,
                error: makeEngineError(
                  'CHALLENGE_FAILED',
                  'Royal-Guard accepted the proof but returned an invalid redirect',
                  { type: 'challenge', diagnostic_message: postLocation, retryable: true },
                ),
                transport: session.transport,
                events,
                attempts: 1,
              };
            }

            finalUrl = nextUrl;
            continue;
          }

          if (postResponse.status === 200) {
            finalUrl = apiUrl;
            await cancelBody(postResponse);
            continue;
          }

          await cancelBody(postResponse);
          return {
            ok: false,
            error: makeEngineError(
              'CHALLENGE_FAILED',
              `Royal-Guard rejected the proof (HTTP ${postResponse.status})`,
              {
                type: 'challenge',
                diagnostic_message: getStatusText(postResponse.status),
                retryable: true,
              },
            ),
            transport: session.transport,
            events,
            attempts: 1,
          };
        }

        const metadata = extractMetadata(body.text, apiUrl);
        const title = metadata.page_title || cleanText(body.text, 200);
        return {
          ok: false,
          error: makeEngineError(
            'UNEXPECTED_HTML',
            'Resolver returned an unexpected HTML page',
            {
              type: 'challenge',
              diagnostic_message: title || 'No Royal-Guard challenge found',
              retryable: true,
            },
          ),
          transport: session.transport,
          events,
          attempts: 1,
        };
      }

      await cancelBody(response);
      return {
        ok: false,
        error: makeEngineError(
          'UNEXPECTED_CONTENT',
          `Resolver returned unsupported content type: ${contentType || 'unknown'}`,
          {
            type: 'http',
            diagnostic_message: finalUrl,
          },
        ),
        transport: session.transport,
        events,
        attempts: 1,
      };
    }

    return {
      ok: false,
      error: makeEngineError('TOO_MANY_REDIRECTS', 'Resolver redirect limit exceeded', {
        type: 'http',
        diagnostic_message: `More than ${MAX_API_REDIRECTS} redirects`,
      }),
      transport: session.transport,
      events,
      attempts: 1,
    };
  } catch (error) {
    const duration = Math.round(performance.now() - requestStarted);
    const aborted =
      error?.name === 'AbortError' || controller.signal.aborted || Date.now() >= deadline;
    const message = aborted
      ? `Resolver timed out after ${session.timeout}ms`
      : error?.cause?.message || error?.message || 'Resolver request failed';

    session.transport = session.transport || {
      request_method: 'GET',
      request_url: apiUrl,
      response_status: null,
      response_message: null,
      response_content_type: null,
      response_size: null,
      response_time: duration,
      response_location: null,
      cache_control: null,
      server: null,
      retry_after: null,
      cf_cache_status: null,
      cf_ray: null,
      cached: false,
    };

    return {
      ok: false,
      error: makeEngineError(aborted ? 'ENGINE_TIMEOUT' : 'NETWORK_ERROR', message, {
        type: aborted ? 'timeout' : 'network',
        diagnostic_message: finalStatus
          ? `HTTP ${finalStatus} ${finalStatusText || ''}`.trim()
          : message,
        retryable: true,
      }),
      transport: session.transport,
      events,
      attempts: 1,
    };
  } finally {
    clearTimeout(timer);
  }
}

function classifyBypassError(message) {
  const text = String(message || 'Bypass failed').trim();
  const lower = text.toLowerCase();

  if (lower.includes('unsupported url') || lower.includes('unsupported')) {
    return makeEngineError('UNSUPPORTED_URL', 'The resolver does not support this URL', {
      type: 'engine',
      diagnostic_message: text,
    });
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return makeEngineError('ENGINE_TIMEOUT', text, {
      type: 'timeout',
      diagnostic_message: text,
      retryable: true,
    });
  }

  if (lower.includes('empty') || lower.includes('no result')) {
    return makeEngineError('EMPTY_RESULT', text, {
      type: 'engine',
      diagnostic_message: text,
      retryable: true,
    });
  }

  return makeEngineError('BYPASS_FAILED', text, {
    type: 'engine',
    diagnostic_message: text,
  });
}

async function requestEngine(session, targetUrl, options = {}) {
  let last = null;
  const maxAttempts = options.maxAttempts ?? MAX_API_ATTEMPTS;
  const challengeStart = session.challengeCount;
  let challengeInfo = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    last = await callEngineOnce(session, targetUrl, options);
    last.attempts = attempt;

    if (session.challengeCount > challengeStart) challengeInfo = session.lastChallenge;

    if (last.ok) break;
    if (!last.error?.retryable) break;
    if (attempt >= maxAttempts) break;

    emit(options, 'warn', `Resolver attempt ${attempt} failed, retrying...`);
    await delay(1200);
  }

  if (last) {
    last.challenge = challengeInfo;
    last.challenge_count = session.challengeCount - challengeStart;
  }

  return last;
}

function emptySource() {
  return {
    page_title: null,
    page_description: null,
    canonical_url: null,
    og_title: null,
    og_description: null,
    og_image: null,
    page_language: null,
  };
}

function emptyHttp() {
  return {
    request_method: 'GET',
    request_url: null,
    response_status: null,
    response_message: null,
    response_content_type: null,
    response_size: null,
    response_time: null,
    response_location: null,
    cache_control: null,
    server: null,
    retry_after: null,
  };
}

function emptyResult() {
  return {
    final_url: null,
    final_domain: null,
    final_protocol: null,
    final_path: null,
    final_query: null,
    final_fragment: null,
    final_url_status: 'unknown',
    final_response_code: null,
    destination_title: null,
    destination_content_type: null,
    resolved_url: null,
  };
}

function emptyRedirect(limit = MAX_REDIRECTS) {
  return {
    count: 0,
    completed: false,
    history: [],
    source: null,
    destination: null,
    limit,
    http_redirects: 0,
    engine_jump: false,
  };
}

function emptyEngine() {
  return {
    name: ENGINE_NAME,
    version: ENGINE_VERSION,
    status: 'idle',
    current_step: 'idle',
    total_steps: 4,
    completed_steps: 0,
    failed_steps: 0,
    processing_start: null,
    processing_end: null,
    processing_time: null,
    processing_attempts: 0,
    processing_message: null,
    trace_id: null,
    trace_count: 0,
    challenge: null,
    challenge_count: 0,
    transport: null,
    handler: null,
    trace: [],
  };
}

function emptyCache(options = {}) {
  return {
    enabled: true,
    status: 'unknown',
    key: null,
    created_at: null,
    expired_at: null,
    age: null,
    fresh_request: Boolean(options.fresh),
  };
}

function createBaseResult(inputUrl, inputType, options) {
  const submittedAt = nowIso();
  return {
    status: 'error',
    request: {
      request_id: randomId('req'),
      input_url: inputUrl,
      normalized_url: null,
      original_domain: null,
      input_type: inputType,
      processing_mode: options.fresh ? 'fresh' : 'normal',
      verbose: options.verbose !== false,
      submitted_at: submittedAt,
      resolved_url: null,
      resolution_method: null,
    },
    platform: null,
    source: emptySource(),
    http: emptyHttp(),
    redirect: emptyRedirect(options.maxRedirects),
    result: emptyResult(),
    engine: emptyEngine(),
    cache: emptyCache(options),
    batch: null,
    error: null,
  };
}

function pushTrace(trace, entry) {
  trace.push({
    trace_step: trace.length + 1,
    trace_level: entry.level || 'info',
    trace_action: entry.action || 'process',
    trace_url: entry.url ?? null,
    trace_status: entry.status || 'info',
    trace_http_code: entry.http_code ?? null,
    trace_duration: entry.duration ?? null,
    trace_message: entry.message ?? null,
    trace_timestamp: nowIso(),
  });
}

function makeErrorDetails({ code, type, step, message, url, diagnostic, retryCount = 0 }) {
  return {
    code,
    type,
    error_step: step,
    message,
    error_url: url || null,
    error_timestamp: nowIso(),
    retry_count: retryCount,
    diagnostic_message: diagnostic || message,
  };
}

function appErrorFrom(error, fallback = {}) {
  if (error instanceof AppError) return error.details;

  return makeErrorDetails({
    code: fallback.code || 'UNEXPECTED_ERROR',
    type: fallback.type || 'internal',
    step: fallback.step || 'unknown',
    message: error?.message || 'An unexpected error occurred',
    url: fallback.url || null,
    diagnostic: error?.cause?.message || error?.message || 'No diagnostic message',
    retryCount: fallback.retryCount || 0,
  });
}

function engineErrorToAppError(error, url, attempts) {
  return new AppError(
    makeErrorDetails({
      code: error?.code || 'BYPASS_FAILED',
      type: error?.type || 'engine',
      step: 'bypass',
      message: error?.message || 'Bypass failed',
      url,
      diagnostic: error?.diagnostic_message || error?.message || 'No diagnostic message',
      retryCount: Math.max(0, (attempts || 1) - 1),
    }),
  );
}

function fillSource(result, sourceProbe) {
  if (!sourceProbe) return;
  result.source = {
    ...emptySource(),
    ...sourceProbe.metadata,
    url: sourceProbe.finalUrl,
    status_code: sourceProbe.finalStatus,
  };
}

function fillHttp(result, sourceProbe, normalizedUrl) {
  result.http.request_method = 'GET';
  result.http.request_url = normalizedUrl;
  if (!sourceProbe || sourceProbe.hops.length === 0) return;

  const first = sourceProbe.hops[0];
  result.http.response_status = first.status_code;
  result.http.response_message = first.status;
  result.http.response_content_type = first.content_type;
  result.http.response_size = first.body_read ? first.size : first.content_length;
  result.http.response_time = first.duration;
  result.http.response_location = first.location;
  result.http.cache_control = first.cache_control;
  result.http.server = first.server;
  result.http.retry_after = first.retry_after;
}

function classifyFinalStatus(status) {
  if (status === null || status === undefined) return 'unknown';
  if (status >= 200 && status < 400) return 'reachable';
  if (status === 401 || status === 403 || status === 429) return 'restricted';
  if (status === 404 || status === 410) return 'missing';
  return 'unreachable';
}

function parseFinalUrl(finalUrl) {
  const parsed = {
    final_url: finalUrl ? String(finalUrl).trim() : null,
    final_domain: null,
    final_protocol: null,
    final_path: null,
    final_query: null,
    final_fragment: null,
  };

  if (!parsed.final_url) return parsed;

  try {
    const url = new URL(parsed.final_url);
    parsed.final_url = url.toString();
    parsed.final_domain = url.hostname;
    parsed.final_protocol = url.protocol;
    parsed.final_path = url.pathname || '/';
    parsed.final_query = url.search || null;
    parsed.final_fragment = url.hash ? url.hash.slice(1) : null;
  } catch {
    // Keep the raw destination if it is not a parsable absolute URL.
  }

  return parsed;
}

function normalizeHttpUrl(value) {
  if (!value) return null;
  try {
    return new URL(String(value).trim()).toString();
  } catch {
    return null;
  }
}

function fillResult(result, engineResult, destinationProbe) {
  const parsed = parseFinalUrl(engineResult);
  const probedFinalUrl = normalizeHttpUrl(destinationProbe?.finalUrl);
  result.result = {
    ...emptyResult(),
    ...parsed,
    final_url_status: destinationProbe
      ? classifyFinalStatus(destinationProbe.finalStatus)
      : 'unknown',
    final_response_code: destinationProbe?.finalStatus ?? null,
    destination_title: destinationProbe?.metadata?.page_title ?? null,
    destination_content_type: destinationProbe?.finalContentType ?? null,
    resolved_url:
      probedFinalUrl && probedFinalUrl !== parsed.final_url ? probedFinalUrl : null,
  };
}

function buildRedirectHistory(sourceProbe, destinationProbe, engineResult, normalizedUrl, limit) {
  const history = [];

  if (sourceProbe) {
    for (const hop of sourceProbe.hops) {
      history.push({
        step: history.length + 1,
        url: hop.url,
        status_code: hop.status_code,
        status: hop.status,
        method: hop.method,
        duration: hop.duration,
        timestamp: hop.timestamp,
        type: hop.type || (history.length === 0 ? 'source' : 'source-redirect'),
      });
    }
  }

  if (engineResult) {
    if (destinationProbe && destinationProbe.hops.length > 0) {
      destinationProbe.hops.forEach((hop, index) => {
        history.push({
          step: history.length + 1,
          url: hop.url,
          status_code: hop.status_code,
          status: hop.status,
          method: hop.method,
          duration: hop.duration,
          timestamp: hop.timestamp,
          type: index === 0 ? 'bypass-destination' : 'destination-redirect',
        });
      });
    } else {
      history.push({
        step: history.length + 1,
        url: engineResult,
        status_code: null,
        status: null,
        method: 'GET',
        duration: null,
        timestamp: nowIso(),
        type: 'bypass-destination',
      });
    }
  }

  return {
    count: history.length,
    completed: Boolean(engineResult) && (destinationProbe ? destinationProbe.completed : true),
    history,
    source: normalizedUrl || null,
    destination: engineResult || null,
    limit,
    http_redirects: history.filter(
      (hop) => typeof hop.status_code === 'number' && hop.status_code >= 300 && hop.status_code < 400,
    ).length,
    engine_jump: Boolean(engineResult),
  };
}

function buildCache(options, targetUrl, engineOut) {
  let status = 'unknown';
  if (engineOut) {
    if (engineOut.cached) status = 'hit';
    else if (options.fresh) status = 'bypass';
    else status = 'miss';
  }

  return {
    enabled: true,
    status,
    key: targetUrl
      ? crypto.createHash('sha256').update(targetUrl).digest('hex').slice(0, 16)
      : null,
    created_at: null,
    expired_at: null,
    age: null,
    fresh_request: Boolean(options.fresh),
  };
}

function resolveNetworkStatus(platform, engineOut) {
  if (!platform) return 'unknown';
  if (engineOut?.ok) return 'working';

  if (!engineOut) {
    return platform.detection_status === 'success'
      ? platform.network_status || 'unknown'
      : 'unknown';
  }

  const code = engineOut.error?.code || '';
  const diagnostic = String(
    engineOut.error?.diagnostic_message || engineOut.error?.message || '',
  ).toLowerCase();

  if (platform.support_status === 'partial') return 'partial';
  if (code === 'UNSUPPORTED_URL') return 'unknown';
  if (code === 'ENGINE_TIMEOUT' || code === 'NETWORK_ERROR' || code.startsWith('HTTP_')) {
    return 'unknown';
  }

  if (
    diagnostic.includes('unreachable') ||
    diagnostic.includes('bypass fail') ||
    diagnostic.includes('failed') ||
    diagnostic.includes('error')
  ) {
    return platform.support_status === 'supported' ? 'failed' : 'unknown';
  }

  return platform.detection_status === 'success' ? 'failed' : 'unknown';
}

function normalizeOptions(options = {}) {
  const timeoutValue = Number(options.timeout);
  const timeout =
    Number.isFinite(timeoutValue) && timeoutValue >= 5000
      ? Math.min(timeoutValue, 300_000)
      : DEFAULT_TIMEOUT;

  const redirectValue = Number(options.maxRedirects);
  const maxRedirects =
    Number.isFinite(redirectValue) && redirectValue >= 0
      ? Math.min(redirectValue, 20)
      : MAX_REDIRECTS;

  return {
    fresh: Boolean(options.fresh),
    verbose: options.verbose !== false,
    timeout,
    probe: options.probe !== false,
    maxRedirects,
    allowPrivateHosts: Boolean(options.allowPrivateHosts),
    onLog: typeof options.onLog === 'function' ? options.onLog : null,
    userAgent: typeof options.userAgent === 'string' && options.userAgent ? options.userAgent : null,
    session: options.session || null,
    internalBatch: Boolean(options.internalBatch),
  };
}

export async function bypass(inputUrl, options = {}) {
  const opts = normalizeOptions(options);
  const rawInput = typeof inputUrl === 'string' ? inputUrl.trim() : '';
  const startedAt = new Date();
  const startedMs = performance.now();

  const result = createBaseResult(rawInput, opts.internalBatch ? 'batch' : 'single', opts);
  result.engine.processing_start = result.request.submitted_at;
  result.engine.trace_id = randomId('trc');

  const trace = result.engine.trace;
  const stages = { normalize: false, detect: false, bypass: false, verify: false };
  const session = opts.session || new EngineSession(opts);

  let normalizedUrl = null;
  let targetUrl = null;
  let sourceProbe = null;
  let destinationProbe = null;
  let engineOut = null;
  let platform = null;
  let engineAttempts = 0;
  let engineChallenge = null;
  let engineChallengeCount = 0;
  let resolvedUrl = null;
  let resolutionMethod = null;

  const onEngineEvent = (data, duration) => {
    let message = 'Resolver event';
    let level = 'info';
    let status = data?.status || 'info';
    let action = `engine_${status}`;

    if (data?.status === 'started') {
      message = 'Resolver worker started';
    } else if (data?.status === 'verbose') {
      message = String(data.message || 'Resolver update');
      if (message.startsWith('Handler matched:')) {
        session.handler = message.slice('Handler matched:'.length).trim();
      }
    } else if (data?.status === 'processing') {
      message = 'Resolver is processing the link...';
    } else if (data?.status === 'success') {
      message = `Destination: ${data.result}`;
      level = 'info';
    } else if (data?.status === 'error') {
      message = String(data.result || 'Bypass failed');
      level = 'error';
    }

    pushTrace(trace, {
      level,
      action,
      url: targetUrl,
      status,
      http_code: 200,
      duration,
      message,
    });

    if (level === 'error') emit(opts, 'error', message);
    else if (data?.status !== 'processing') emit(opts, 'info', message);
  };

  try {
    if (!rawInput) {
      throw new AppError(
        makeErrorDetails({
          code: 'INVALID_URL',
          type: 'validation',
          step: 'normalize',
          message: 'A URL is required',
          url: rawInput || null,
          diagnostic: 'The input URL is empty',
        }),
      );
    }

    let normalized;
    try {
      normalized = normalizeInput(rawInput);
    } catch (error) {
      throw new AppError(
        makeErrorDetails({
          code: 'INVALID_URL',
          type: 'validation',
          step: 'normalize',
          message: 'Invalid URL',
          url: rawInput,
          diagnostic: error.message,
        }),
      );
    }

    if (!opts.allowPrivateHosts && isPrivateHost(normalized.url.hostname)) {
      throw new AppError(
        makeErrorDetails({
          code: 'PRIVATE_HOST',
          type: 'validation',
          step: 'normalize',
          message: 'Private or local hosts are not allowed',
          url: normalized.normalized,
          diagnostic: `Blocked hostname: ${normalized.url.hostname}`,
        }),
      );
    }

    normalizedUrl = normalized.normalized;
    targetUrl = normalizedUrl;
    result.request.normalized_url = normalizedUrl;
    result.request.original_domain = normalized.domain;
    result.cache.key = crypto.createHash('sha256').update(normalizedUrl).digest('hex').slice(0, 16);
    stages.normalize = true;

    pushTrace(trace, {
      action: 'normalize',
      url: normalizedUrl,
      status: 'success',
      message: 'URL normalized',
      duration: 0,
    });
    emit(opts, 'info', `Normalized: ${normalizedUrl}`);

    platform = detectPlatform(normalizedUrl);
    result.platform = platform;
    stages.detect = true;

    pushTrace(trace, {
      action: 'detect',
      url: normalizedUrl,
      status: platform.detection_status === 'success' ? 'success' : 'warning',
      level: platform.detection_status === 'success' ? 'info' : 'warning',
      message:
        platform.detection_status === 'success'
          ? `Platform detected: ${platform.name}`
          : `Platform not in local table; resolver will decide (${platform.domain})`,
      duration: 0,
    });
    emit(
      opts,
      platform.detection_status === 'success' ? 'info' : 'warn',
      platform.detection_status === 'success'
        ? `Platform: ${platform.name}`
        : `Unknown platform: ${platform.domain}`,
    );

    if (opts.probe) {
      try {
        sourceProbe = await probeUrl(normalizedUrl, {
          timeoutMs: Math.min(PROBE_TIMEOUT, opts.timeout),
          maxRedirects: opts.maxRedirects,
          userAgent: session.userAgent,
        });
        fillSource(result, sourceProbe);
        fillHttp(result, sourceProbe, normalizedUrl);

        const first = sourceProbe.hops[0];
        pushTrace(trace, {
          action: 'source_probe',
          url: normalizedUrl,
          status: sourceProbe.finalStatus && sourceProbe.finalStatus < 400 ? 'success' : 'warning',
          level: sourceProbe.finalStatus && sourceProbe.finalStatus < 400 ? 'info' : 'warning',
          http_code: first?.status_code ?? null,
          duration: sourceProbe.totalTime,
          message: `Source responded HTTP ${first?.status_code ?? 'N/A'}${sourceProbe.finalUrl !== normalizedUrl ? `, resolved to ${sourceProbe.finalUrl}` : ''}`,
        });
      } catch (error) {
        pushTrace(trace, {
          action: 'source_probe',
          url: normalizedUrl,
          status: 'warning',
          level: 'warning',
          duration: null,
          message: `Source metadata unavailable: ${error.message}`,
        });
        emit(opts, 'warn', `Source metadata unavailable: ${error.message}`);
      }
    }

    engineOut = await requestEngine(session, targetUrl, {
      fresh: opts.fresh,
      onEvent: onEngineEvent,
    });
    engineAttempts += engineOut.attempts || 1;
    engineChallengeCount += engineOut.challenge_count || 0;
    if (engineOut.challenge) engineChallenge = engineOut.challenge;

    if (
      !engineOut.ok &&
      engineOut.error?.code === 'UNSUPPORTED_URL' &&
      sourceProbe?.finalUrl &&
      sourceProbe.finalUrl !== targetUrl &&
      !isPrivateUrl(sourceProbe.finalUrl)
    ) {
      const retryUrl = new URL(sourceProbe.finalUrl).toString();
      resolvedUrl = retryUrl;
      resolutionMethod = 'http-redirect';

      pushTrace(trace, {
        action: 'auto_resolve',
        url: retryUrl,
        status: 'info',
        level: 'info',
        duration: null,
        message: 'Resolver rejected the original URL; retrying with the HTTP redirect target',
      });
      emit(opts, 'info', `Retrying with resolved URL: ${retryUrl}`);

      const retryPlatform = detectPlatform(retryUrl);
      if (retryPlatform.detection_status === 'success') {
        platform = retryPlatform;
        result.platform = platform;
      }

      targetUrl = retryUrl;
      engineOut = await requestEngine(session, targetUrl, {
        fresh: opts.fresh,
        onEvent: onEngineEvent,
      });
      engineAttempts += engineOut.attempts || 1;
      engineChallengeCount += engineOut.challenge_count || 0;
      if (engineOut.challenge) engineChallenge = engineOut.challenge;
    }

    result.request.resolved_url = resolvedUrl;
    result.request.resolution_method = resolutionMethod;
    result.engine.processing_attempts = engineAttempts;
    result.engine.challenge = engineChallenge;
    result.engine.challenge_count = engineChallengeCount;
    result.engine.transport = engineOut.transport || session.transport || null;
    result.engine.handler = session.handler;

    platform.network_status = resolveNetworkStatus(platform, engineOut);
    if (engineOut.ok && platform.support_status === 'unknown') {
      platform.support_status = 'supported';
    } else if (
      !engineOut.ok &&
      engineOut.error?.code === 'UNSUPPORTED_URL' &&
      platform.detection_status !== 'success'
    ) {
      platform.support_status = 'unsupported';
    }

    if (!engineOut.ok) {
      throw engineErrorToAppError(engineOut.error, targetUrl, engineAttempts);
    }

    stages.bypass = true;
    const engineResult = engineOut.result;

    if (opts.probe && engineResult) {
      try {
        destinationProbe = await probeUrl(engineResult, {
          timeoutMs: Math.min(PROBE_TIMEOUT, opts.timeout),
          maxRedirects: opts.maxRedirects,
          userAgent: session.userAgent,
        });

        pushTrace(trace, {
          action: 'destination_probe',
          url: engineResult,
          status:
            destinationProbe.finalStatus && destinationProbe.finalStatus < 400
              ? 'success'
              : 'warning',
          level:
            destinationProbe.finalStatus && destinationProbe.finalStatus < 400
              ? 'info'
              : 'warning',
          http_code: destinationProbe.finalStatus,
          duration: destinationProbe.totalTime,
          message: `Destination responded HTTP ${destinationProbe.finalStatus ?? 'N/A'}`,
        });
      } catch (error) {
        pushTrace(trace, {
          action: 'destination_probe',
          url: engineResult,
          status: 'warning',
          level: 'warning',
          duration: null,
          message: `Destination metadata unavailable: ${error.message}`,
        });
        emit(opts, 'warn', `Destination metadata unavailable: ${error.message}`);
      }
    }

    fillResult(result, engineResult, destinationProbe);
    result.redirect = buildRedirectHistory(
      sourceProbe,
      destinationProbe,
      engineResult,
      normalizedUrl || targetUrl,
      opts.maxRedirects,
    );
    result.engine.transport = engineOut.transport || result.engine.transport;
    stages.verify = true;

    result.status = 'success';
    result.error = null;
    result.engine.status = 'completed';
    result.engine.current_step = 'completed';
    result.engine.processing_message = `Bypass completed: ${engineResult}`;
    result.cache = buildCache(opts, targetUrl, engineOut);

    pushTrace(trace, {
      action: 'complete',
      url: engineResult,
      status: 'success',
      http_code: destinationProbe?.finalStatus ?? null,
      duration: null,
      message: 'Bypass completed successfully',
    });
    emit(opts, 'info', `Bypass OK: ${engineResult}`);

    return result;
  } catch (error) {
    const details = appErrorFrom(error, {
      code: 'UNEXPECTED_ERROR',
      type: 'internal',
      step: stages.bypass ? 'verify' : stages.detect ? 'bypass' : 'normalize',
      url: targetUrl || normalizedUrl || rawInput || null,
    });

    result.status = 'error';
    result.error = details;
    result.engine.status = 'failed';
    result.engine.current_step = details.error_step;
    result.engine.processing_message = details.message;
    result.engine.processing_attempts = engineAttempts;
    result.engine.challenge = engineChallenge;
    result.engine.challenge_count = engineChallengeCount;
    result.engine.transport = engineOut?.transport || session.transport || null;
    result.engine.handler = session.handler;

    if (platform) {
      platform.network_status = resolveNetworkStatus(platform, engineOut);
      if (
        !engineOut?.ok &&
        engineOut?.error?.code === 'UNSUPPORTED_URL' &&
        platform.detection_status !== 'success'
      ) {
        platform.support_status = 'unsupported';
      }
    }

    result.redirect = buildRedirectHistory(
      sourceProbe,
      null,
      null,
      normalizedUrl || rawInput || null,
      opts.maxRedirects,
    );
    result.cache = buildCache(opts, targetUrl || normalizedUrl, engineOut || null);

    pushTrace(trace, {
      action: 'error',
      url: targetUrl || normalizedUrl || rawInput || null,
      status: 'failed',
      level: 'error',
      http_code: engineOut?.transport?.response_status ?? null,
      duration: null,
      message: details.message,
    });
    emit(opts, 'error', `${details.code}: ${details.message}`);

    return result;
  } finally {
    result.engine.processing_end = nowIso();
    result.engine.processing_time = Math.round(performance.now() - startedMs);
    result.engine.trace = trace;
    result.engine.trace_count = trace.length;
    result.engine.completed_steps = Object.values(stages).filter(Boolean).length;
    result.engine.failed_steps = result.status === 'error' ? 1 : 0;
    if (result.status === 'success') {
      result.engine.completed_steps = 4;
      result.engine.failed_steps = 0;
    }

    if (result.platform) {
      result.platform.network_status = resolveNetworkStatus(result.platform, engineOut);
    }
  }
}

export function extractUrlsFromText(text) {
  const source = String(text || '');
  const found = [];
  const seen = new Set();

  const add = (value) => {
    let url = String(value || '').trim();
    if (!url) return;

    url = url.replace(/^[<("'`]+/, '').replace(/[>"'`]+$/, '');
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
      if (!url.includes('.') || /\s/.test(url)) return;
      url = `https://${url}`;
    }

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return;
      const normalized = parsed.toString();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      found.push(normalized);
    } catch {
      // Ignore malformed URLs.
    }
  };

  const matches = source.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  if (matches.length > 0) {
    for (const match of matches) {
      add(match.replace(/[.,;!?]+$/g, ''));
    }
    return found;
  }

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine
      .trim()
      .replace(/^[-*•]\s+/, '')
      .replace(/^\d+[.)]\s+/, '');
    if (!line || line.startsWith('#')) continue;

    const extracted = line.match(/https?:\/\/[^\s"'<>]+/gi) || [];
    if (extracted.length > 0) {
      for (const match of extracted) add(match.replace(/[.,;!?]+$/g, ''));
      continue;
    }

    if (!/\s/.test(line) && line.includes('.')) add(line);
  }

  return found;
}

function summarizeBatchItem(result) {
  return {
    request_id: result.request?.request_id ?? null,
    input_url: result.request?.input_url ?? null,
    resolved_url: result.request?.resolved_url ?? null,
    status: result.status,
    platform: result.platform
      ? {
          name: result.platform.name,
          id: result.platform.id,
          domain: result.platform.domain,
          support_status: result.platform.support_status,
          network_status: result.platform.network_status,
        }
      : null,
    final_url: result.result?.final_url ?? null,
    final_domain: result.result?.final_domain ?? null,
    final_response_code: result.result?.final_response_code ?? null,
    final_url_status: result.result?.final_url_status ?? null,
    destination_title: result.result?.destination_title ?? null,
    cache_status: result.cache?.status ?? null,
    processing_time: result.engine?.processing_time ?? null,
    error: result.error ?? null,
  };
}

export async function bypassBatch(inputs, options = {}) {
  const opts = normalizeOptions(options);
  const startedAt = new Date();
  const startedMs = performance.now();

  let list;
  if (Array.isArray(inputs)) {
    list = [];
    const seen = new Set();
    for (const item of inputs) {
      for (const url of extractUrlsFromText(String(item ?? ''))) {
        if (seen.has(url)) continue;
        seen.add(url);
        list.push(url);
      }
    }
  } else {
    list = extractUrlsFromText(String(inputs ?? ''));
  }

  const result = createBaseResult(null, 'batch', opts);
  result.request.inputs = list;
  result.engine.processing_start = result.request.submitted_at;
  result.engine.trace_id = randomId('trc');

  const batchId = randomId('batch');
  const batchResults = [];
  let success = 0;
  let failed = 0;
  let engineAttempts = 0;
  let lastChallenge = null;
  let challengeCount = 0;

  const batch = {
    batch_id: batchId,
    batch_total: list.length,
    batch_success: 0,
    batch_failed: 0,
    batch_pending: list.length,
    batch_results: batchResults,
    batch_processing_time: null,
  };

  result.batch = batch;

  if (list.length === 0) {
    result.status = 'error';
    result.error = makeErrorDetails({
      code: 'NO_VALID_URLS',
      type: 'validation',
      step: 'batch',
      message: 'No valid URLs were found in the batch input',
      url: null,
      diagnostic: 'Provide at least one http:// or https:// URL',
    });
    result.engine.status = 'failed';
    result.engine.current_step = 'batch';
    result.engine.processing_message = result.error.message;
    result.engine.total_steps = 0;
    result.engine.completed_steps = 0;
    result.engine.failed_steps = 0;
    result.engine.processing_end = nowIso();
    result.engine.processing_time = Math.round(performance.now() - startedMs);
    result.cache = buildCache(opts, null, null);
    return result;
  }

  const session = opts.session || new EngineSession(opts);

  for (let index = 0; index < list.length; index += 1) {
    const url = list[index];
    emit(opts, 'info', `Batch ${index + 1}/${list.length}: ${url}`);

    const item = await bypass(url, {
      ...opts,
      session,
      internalBatch: true,
    });

    batchResults.push(summarizeBatchItem(item));
    engineAttempts += item.engine?.processing_attempts || 0;
    challengeCount += item.engine?.challenge_count || 0;
    if (item.engine?.challenge) lastChallenge = item.engine.challenge;

    if (item.status === 'success') success += 1;
    else failed += 1;

    if (index < list.length - 1) {
      const wait = Math.floor(
        Math.random() * (BATCH_DELAY_MAX - BATCH_DELAY_MIN + 1) + BATCH_DELAY_MIN,
      );
      await delay(wait);
    }
  }

  batch.batch_success = success;
  batch.batch_failed = failed;
  batch.batch_pending = list.length - success - failed;
  batch.batch_processing_time = Math.round(performance.now() - startedMs);

  result.engine.total_steps = list.length;
  result.engine.completed_steps = success;
  result.engine.failed_steps = failed;
  result.engine.processing_attempts = engineAttempts;
  result.engine.challenge = lastChallenge;
  result.engine.challenge_count = challengeCount;
  result.engine.processing_end = nowIso();
  result.engine.processing_time = Math.round(performance.now() - startedMs);

  if (failed === 0) {
    result.status = 'success';
    result.error = null;
    result.engine.status = 'completed';
    result.engine.current_step = 'completed';
    result.engine.processing_message = `${success}/${list.length} URL(s) bypassed`;
  } else if (success === 0) {
    result.status = 'error';
    result.engine.status = 'failed';
    result.engine.current_step = 'batch';
    result.engine.processing_message = `${failed}/${list.length} URL(s) failed`;
    result.error = makeErrorDetails({
      code: 'BATCH_FAILED',
      type: 'batch',
      step: 'batch',
      message: `All ${list.length} URL(s) failed`,
      url: null,
      diagnostic: batchResults
        .filter((item) => item.status !== 'success')
        .map((item) => `${item.input_url}: ${item.error?.message || 'failed'}`)
        .join(' | ')
        .slice(0, 2000),
      retryCount: 0,
    });
  } else {
    result.status = 'partial';
    result.engine.status = 'partial';
    result.engine.current_step = 'batch';
    result.engine.processing_message = `${success}/${list.length} URL(s) bypassed, ${failed} failed`;
    result.error = makeErrorDetails({
      code: 'BATCH_PARTIAL',
      type: 'batch',
      step: 'batch',
      message: `${failed}/${list.length} URL(s) failed`,
      url: null,
      diagnostic: batchResults
        .filter((item) => item.status !== 'success')
        .map((item) => `${item.input_url}: ${item.error?.message || 'failed'}`)
        .join(' | ')
        .slice(0, 2000),
      retryCount: 0,
    });
  }

  const cacheStatuses = batchResults.map((item) => item.cache_status).filter(Boolean);
  let cacheStatus = 'unknown';
  if (cacheStatuses.length > 0) {
    if (cacheStatuses.every((status) => status === 'hit')) cacheStatus = 'hit';
    else if (cacheStatuses.every((status) => status === 'miss')) cacheStatus = 'miss';
    else if (cacheStatuses.every((status) => status === 'bypass')) cacheStatus = 'bypass';
    else cacheStatus = 'mixed';
  }

  result.cache = {
    enabled: true,
    status: cacheStatus,
    key: crypto.createHash('sha256').update(list.join('\n')).digest('hex').slice(0, 16),
    created_at: null,
    expired_at: null,
    age: null,
    fresh_request: Boolean(opts.fresh),
  };

  result.engine.trace = [];
  result.engine.trace_count = 0;

  return result;
}

function parseTimeoutValue(value) {
  const text = String(value || '').trim().toLowerCase();
  if (/^\d+$/.test(text)) return Number(text) * 1000;
  if (/^\d+ms$/.test(text)) return Number(text.slice(0, -2));
  if (/^\d+s$/.test(text)) return Number(text.slice(0, -1)) * 1000;
  throw new Error(`Invalid timeout value: ${value}`);
}

function parseCliArgs(argv) {
  const options = {
    fresh: false,
    verbose: true,
    probe: true,
    timeout: DEFAULT_TIMEOUT,
    maxRedirects: MAX_REDIRECTS,
    allowPrivateHosts: false,
    quiet: false,
    compact: false,
    out: 'result.json',
    stdin: false,
    help: false,
    version: false,
    texts: [],
    files: [],
  };

  const readValue = (arg, index, name) => {
    if (arg.includes('=')) return { value: arg.slice(arg.indexOf('=') + 1), index };
    if (index + 1 >= argv.length) throw new Error(`Missing value for ${name}`);
    return { value: argv[index + 1], index: index + 1 };
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version') {
      options.version = true;
    } else if (arg === '--fresh') {
      options.fresh = true;
    } else if (arg === '--normal') {
      options.fresh = false;
    } else if (arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '--compact') {
      options.compact = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--no-verbose') {
      options.verbose = false;
    } else if (arg === '--probe') {
      options.probe = true;
    } else if (arg === '--no-probe') {
      options.probe = false;
    } else if (arg === '--allow-private') {
      options.allowPrivateHosts = true;
    } else if (arg === '--stdin') {
      options.stdin = true;
    } else if (arg.startsWith('--timeout')) {
      const { value, index: nextIndex } = readValue(arg, index, '--timeout');
      options.timeout = parseTimeoutValue(value);
      index = nextIndex;
    } else if (arg.startsWith('--max-redirects')) {
      const { value, index: nextIndex } = readValue(arg, index, '--max-redirects');
      options.maxRedirects = Number(value);
      if (!Number.isInteger(options.maxRedirects) || options.maxRedirects < 0) {
        throw new Error(`Invalid --max-redirects value: ${value}`);
      }
      index = nextIndex;
    } else if (arg.startsWith('--out=') || arg.startsWith('--output=')) {
      options.out = arg.slice(arg.indexOf('=') + 1) || 'result.json';
    } else if (arg === '--out' || arg === '--output') {
      if (index + 1 >= argv.length) throw new Error(`Missing value for ${arg}`);
      options.out = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--file=')) {
      options.files.push(arg.slice('--file='.length));
    } else if (arg === '--file') {
      const { value, index: nextIndex } = readValue(arg, index, '--file');
      options.files.push(value);
      index = nextIndex;
    } else if (arg.startsWith('--url=')) {
      options.texts.push(arg.slice('--url='.length));
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.texts.push(arg);
    }
  }

  return options;
}

function printHelp() {
  const text = `
RIP.LINKVERTISE.LOL bypass scraper

Usage:
  node scrape-bypass.js <url> [options]
  node scrape-bypass.js <url1> <url2> ... [options]
  node scrape-bypass.js --file=urls.txt [options]

Options:
  --fresh              Skip the resolver cache (fresh request)
  --normal             Use the resolver cache (default)
  --no-probe           Skip source/destination HTTP metadata
  --timeout=90         Total timeout in seconds, or use 90s / 90000ms (default: 90s)
  --max-redirects=6    Maximum redirects followed per URL (default: 6)
  --out=result.json    Output file (default: result.json)
  --compact            Compact JSON output
  --quiet              Suppress progress logs
  --no-verbose         Disable resolver verbose events
  --allow-private      Allow private/local hosts (disabled by default)
  --file=path          Read URLs from a text file
  --stdin              Read URLs from stdin
  --help               Show this help
  --version            Show the version

Examples:
  node scrape-bypass.js "https://linkvertise.com/514008/hydrogen-download"
  node scrape-bypass.js "https://loot-link.com/s?2j2wXWWH" --fresh
  node scrape-bypass.js --file=urls.txt --out=result.json
`.trim();
  process.stdout.write(`${text}\n`);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  let args;
  try {
    args = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`Argument error: ${error.message}\n\n`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (args.help) {
    printHelp();
    return;
  }

  if (args.version) {
    process.stdout.write(`${SCRAPER_VERSION}\n`);
    return;
  }

  const texts = [...args.texts];

  for (const file of args.files) {
    try {
      texts.push(await fs.readFile(path.resolve(process.cwd(), file), 'utf8'));
    } catch (error) {
      process.stderr.write(`Could not read ${file}: ${error.message}\n`);
      process.exitCode = 1;
      return;
    }
  }

  if (args.stdin) {
    try {
      texts.push(await readStdin());
    } catch (error) {
      process.stderr.write(`Could not read stdin: ${error.message}\n`);
      process.exitCode = 1;
      return;
    }
  }

  const urls = extractUrlsFromText(texts.join('\n'));

  if (urls.length === 0) {
    process.stderr.write('No valid URL found. Provide an http:// or https:// URL.\n\n');
    printHelp();
    process.exitCode = 1;
    return;
  }

  const runOptions = {
    fresh: args.fresh,
    verbose: args.verbose,
    timeout: args.timeout,
    probe: args.probe,
    maxRedirects: args.maxRedirects,
    allowPrivateHosts: args.allowPrivateHosts,
    onLog: args.quiet
      ? null
      : ({ level, message }) => {
          const prefix = level === 'error' ? '[x]' : level === 'warn' ? '[!]' : '[i]';
          process.stderr.write(`${prefix} ${message}\n`);
        },
  };

  let output;
  if (urls.length === 1) {
    output = await bypass(urls[0], runOptions);
  } else {
    output = await bypassBatch(urls, runOptions);
  }

  const json = JSON.stringify(output, null, args.compact ? 0 : 2);

  if (args.out !== '-') {
    const outputPath = path.resolve(process.cwd(), args.out);
    try {
      await fs.writeFile(outputPath, `${json}\n`, 'utf8');
      if (!args.quiet) process.stderr.write(`[i] Saved: ${outputPath}\n`);
    } catch (error) {
      process.stderr.write(`Could not write ${outputPath}: ${error.message}\n`);
      process.exitCode = 1;
    }
  }

  process.stdout.write(`${json}\n`);

  if (!args.quiet) {
    if (output.status === 'success') {
      const destination =
        output.result?.final_url ||
        output.batch?.batch_results?.find((item) => item.final_url)?.final_url ||
        'n/a';
      process.stderr.write(`[ok] ${destination}\n`);
    } else {
      process.stderr.write(`[x] ${output.error?.message || 'Scrape failed'}\n`);
    }
  }

  if (output.status === 'error') process.exitCode = 1;
  else if (output.status === 'partial') process.exitCode = 2;
  else process.exitCode = 0;
}

const currentFile = fileURLToPath(import.meta.url);
const isMain =
  typeof process.argv[1] === 'string' && path.resolve(process.argv[1]) === path.resolve(currentFile);

if (isMain) {
  main().catch(async (error) => {
    const message = error?.message || 'Unexpected error';
    const fallback = createBaseResult(null, 'single', normalizeOptions({}));
    fallback.status = 'error';
    fallback.engine.status = 'failed';
    fallback.engine.current_step = 'unknown';
    fallback.engine.processing_message = message;
    fallback.error = makeErrorDetails({
      code: 'UNEXPECTED_ERROR',
      type: 'internal',
      step: 'unknown',
      message,
      diagnostic: error?.stack ? String(error.stack).slice(0, 2000) : message,
    });

    const json = JSON.stringify(fallback, null, 2);
    try {
      await fs.writeFile(path.resolve(process.cwd(), 'result.json'), `${json}\n`, 'utf8');
    } catch {
      // Ignore fallback write errors.
    }
    process.stdout.write(`${json}\n`);
    process.stderr.write(`[x] ${message}\n`);
    process.exitCode = 1;
  });
}

export default {
  bypass,
  bypassBatch,
  extractUrlsFromText,
  detectPlatform,
};



