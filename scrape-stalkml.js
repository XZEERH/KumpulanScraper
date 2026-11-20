#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const VERSION = '1.0.0';
const GAME = 'Mobile Legends: Bang Bang';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 120_000;
const DEFAULT_RETRIES = 1;
const MAX_RETRIES = 3;
const DEFAULT_OUT = 'result.json';
const MAX_BODY_BYTES = 1_500_000;
const MAX_NICKNAME_LENGTH = 64;
const USER_AGENT = `mlbb-stalker/${VERSION} (+public account lookup)`;

const ENDPOINTS = {
  isanFind: 'https://mlbb-api.isan.eu.org/find',
  isanNickname: 'https://api.isan.eu.org/nickname/ml',
  gopay: 'https://gopay.co.id/games/v1/order/user-account'
};

const COUNTRY_NAMES = {
  AE: 'United Arab Emirates',
  AR: 'Argentina',
  AU: 'Australia',
  BD: 'Bangladesh',
  BN: 'Brunei',
  BR: 'Brazil',
  CL: 'Chile',
  CN: 'China',
  CO: 'Colombia',
  DE: 'Germany',
  ES: 'Spain',
  FR: 'France',
  GB: 'United Kingdom',
  HK: 'Hong Kong',
  ID: 'Indonesia',
  IN: 'India',
  IT: 'Italy',
  JP: 'Japan',
  KH: 'Cambodia',
  KR: 'South Korea',
  LA: 'Laos',
  MM: 'Myanmar',
  MX: 'Mexico',
  MY: 'Malaysia',
  PE: 'Peru',
  PH: 'Philippines',
  PK: 'Pakistan',
  RU: 'Russia',
  SA: 'Saudi Arabia',
  SG: 'Singapore',
  TH: 'Thailand',
  TL: 'Timor-Leste',
  TR: 'Turkey',
  TW: 'Taiwan',
  US: 'United States',
  VN: 'Vietnam'
};

const COUNTRY_CODES = Object.fromEntries(
  Object.entries(COUNTRY_NAMES).map(([code, name]) => [normalizeIdentity(name), code])
);

/* --------------------------------------------------------------------------
 * Small utilities
 * ----------------------------------------------------------------------- */

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function truncate(value, max = 300) {
  const text = value == null ? '' : String(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function cleanNickname(value) {
  if (value == null) return null;
  let text = String(value).trim();
  if (!text) return null;
  text = text.replace(/[\u0000-\u001f\u007f]/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return Array.from(text).slice(0, MAX_NICKNAME_LENGTH).join('');
}

function cleanText(value, max = 120) {
  if (value == null) return null;
  let text = String(value).replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return truncate(text, max);
}

function normalizeIdentity(value) {
  if (value == null) return '';
  return String(value)
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeCountryCode(value) {
  if (value == null) return null;
  const text = String(value).trim().toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(text)) return null;
  if (text === 'UK') return 'GB';
  if (text === 'USA') return 'US';
  if (text === 'UAE') return 'AE';
  return text;
}

let countryDisplayNames = null;
try {
  if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
    countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });
  }
} catch {
  countryDisplayNames = null;
}

function countryNameFromCode(code) {
  if (!code) return null;
  if (COUNTRY_NAMES[code]) return COUNTRY_NAMES[code];
  if (countryDisplayNames) {
    try {
      const name = countryDisplayNames.of(code);
      if (name && name !== code) return name;
    } catch {
      // Unknown region code.
    }
  }
  return null;
}

function countryCodeFromName(name) {
  const key = normalizeIdentity(name);
  if (!key) return null;
  if (COUNTRY_CODES[key]) return COUNTRY_CODES[key];
  return null;
}

function decodeFormComponent(value) {
  const text = String(value).replace(/\+/g, '%20');
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function stripHtml(value) {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractApiMessage(json, text) {
  const candidates = [
    json && json.message,
    json && json.error,
    json && json.error && json.error.message,
    json && json.error_description,
    json && json.msg,
    json && json.title,
    json && json.detail,
    json && json.statusMessage,
    json && json.data && json.data.message,
    json && Array.isArray(json.errors) && json.errors[0] && json.errors[0].message,
    json && Array.isArray(json.errors) && json.errors[0]
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return truncate(stripHtml(candidate), 240);
    }
  }
  if (text) {
    const body = String(text);
    if (/^\s*<(?:!doctype|html)/i.test(body)) {
      const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(body);
      if (title && title[1]) return truncate(stripHtml(title[1]), 240);
    }
    const cleaned = stripHtml(body);
    if (cleaned) return truncate(cleaned, 240);
  }
  return '';
}

function parseJson(text) {
  if (text == null) return null;
  const body = String(text).replace(/^\uFEFF/, '').trim();
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    // Some JSONP endpoints wrap objects. Support them without eval.
    const jsonp = /^[\w$.]+\s*\(([\s\S]*)\)\s*;?\s*$/.exec(body);
    if (jsonp) {
      try {
        return JSON.parse(jsonp[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* --------------------------------------------------------------------------
 * Input parsing
 * ----------------------------------------------------------------------- */

const ID_PATTERN = /^\d{3,20}$/;
const ZONE_PATTERN = /^\d{1,6}$/;

function parsed(id, zone, nickname) {
  return {
    id: id == null ? null : String(id).trim(),
    zone: zone == null ? null : String(zone).trim(),
    nickname: nickname == null ? null : cleanNickname(nickname)
  };
}

/**
 * Parse one account string. Supported shapes include:
 *   12345678 1234
 *   12345678 (1234)
 *   12345678|1234
 *   12345678:1234
 *   TIKUS BANGKET 12345678 1234
 *   12345678 1234 TIKUS BANGKET
 *   RazeerhNarh:3 12345678
 *   12345678 RazeerhNarh:3
 *
 * A nickname without a User ID (for example "RazeerhNarh :3") is parsed as a
 * nickname query. It is not resolvable through free public endpoints.
 */
function parseAccountString(input) {
  const raw = input == null ? '' : String(input).trim();
  if (!raw) return parsed(null, null, null);

  let match;

  // Exact ID + Zone forms.
  match = /^(\d{3,20})\s*[\(\[\{]\s*(\d{1,6})\s*[\)\]\}]$/.exec(raw);
  if (match) return parsed(match[1], match[2], null);

  match = /^(\d{3,20})\s*[|,;:/_-]\s*(\d{1,6})$/.exec(raw);
  if (match) return parsed(match[1], match[2], null);

  match = /^(\d{3,20})\s+(\d{1,6})$/.exec(raw);
  if (match) return parsed(match[1], match[2], null);

  match = /^(?:user[\s_-]*id|id)\s*[:=]\s*(\d{3,20})\s*[,;\s]+\s*(?:zone[\s_-]*id|zone|server)\s*[:=]\s*(\d{1,6})$/i.exec(raw);
  if (match) return parsed(match[1], match[2], null);

  match = /^(?:zone[\s_-]*id|zone|server)\s*[:=]\s*(\d{1,6})\s*[,;\s]+\s*(?:user[\s_-]*id|id)\s*[:=]\s*(\d{3,20})$/i.exec(raw);
  if (match) return parsed(match[2], match[1], null);

  // Whitespace before a colon followed by 1-2 digits is treated as an
  // emoticon-style nickname suffix ("RazeerhNarh :3"), not as a
  // nickname:zone separator. A standalone numeric User ID may still be split
  // off; the zone can then be supplied with --zone.
  match = /^(\d{3,20})\s+(.+?\s:\s*\d{1,2})$/.exec(raw);
  if (match) return parsed(match[1], null, match[2]);

  match = /^(.+?\s:\s*\d{1,2})\s+(\d{3,20})$/.exec(raw);
  if (match) return parsed(match[2], null, match[1]);

  match = /^(.+?\s:\s*\d{1,2})$/.exec(raw);
  if (match) return parsed(null, null, match[1]);

  // Nickname + zone followed/preceded by the numeric User ID.
  match = /^(.+?)\s*:\s*(\d{1,6})\s+(\d{3,20})$/.exec(raw);
  if (match && !/^\d+$/.test(match[1].trim())) {
    return parsed(match[3], match[2], match[1]);
  }

  match = /^(\d{3,20})\s+(.+?)\s*:\s*(\d{1,6})$/.exec(raw);
  if (match && !/^\d+$/.test(match[2].trim())) {
    return parsed(match[1], match[3], match[2]);
  }

  // Nickname + long ID, with the zone supplied separately or in parentheses.
  match = /^(.+?)\s*:\s*(\d{7,20})\s+(\d{1,6})$/.exec(raw);
  if (match && !/^\d+$/.test(match[1].trim())) {
    return parsed(match[2], match[3], match[1]);
  }

  match = /^(.+?)\s*:\s*(\d{7,20})\s*[\(\[\{]\s*(\d{1,6})\s*[\)\]\}]$/.exec(raw);
  if (match && !/^\d+$/.test(match[1].trim())) {
    return parsed(match[2], match[3], match[1]);
  }

  // Nickname and an ID(zone) block.
  match = /^(.+?)\s+(\d{3,20})\s*[\(\[\{]\s*(\d{1,6})\s*[\)\]\}]$/.exec(raw);
  if (match && !/^\d+$/.test(match[1].trim())) {
    return parsed(match[2], match[3], match[1]);
  }

  match = /^(\d{3,20})\s*[\(\[\{]\s*(\d{1,6})\s*[\)\]\}]\s+(.+)$/.exec(raw);
  if (match) return parsed(match[1], match[2], match[3]);

  // Nickname and an ID|zone block.
  match = /^(.+?)\s+(\d{3,20})\s*[|,;:/_-]\s*(\d{1,6})$/.exec(raw);
  if (match && !/^\d+$/.test(match[1].trim())) {
    return parsed(match[2], match[3], match[1]);
  }

  match = /^(\d{3,20})\s*[|,;:/_-]\s*(\d{1,6})\s+(.+)$/.exec(raw);
  if (match) return parsed(match[1], match[2], match[3]);

  // Nickname + ID + zone, in various orders.
  match = /^(.+?)\s+(\d{3,20})\s+(\d{1,6})$/.exec(raw);
  if (match && !/^\d+$/.test(match[1].trim())) {
    return parsed(match[2], match[3], match[1]);
  }

  match = /^(.+?)\s+(\d{1,6})\s+(\d{3,20})$/.exec(raw);
  if (match && !/^\d+$/.test(match[1].trim())) {
    return parsed(match[3], match[2], match[1]);
  }

  match = /^(\d{3,20})\s+(\d{1,6})\s+(.+)$/.exec(raw);
  if (match) return parsed(match[1], match[2], match[3]);

  match = /^(\d{3,20})\s+(.+?)\s+(\d{1,6})$/.exec(raw);
  if (match && !/^\d+$/.test(match[2].trim())) {
    return parsed(match[1], match[3], match[2]);
  }

  // Nickname:zone without an ID. The ID still has to be supplied separately.
  match = /^(.+?)\s*:\s*(\d{1,6})$/.exec(raw);
  if (match && !/^\d+$/.test(match[1].trim())) {
    return parsed(null, match[2], match[1]);
  }

  // Nickname:long-ID without a zone. The zone still has to be supplied separately.
  match = /^(.+?)\s*:\s*(\d{7,20})$/.exec(raw);
  if (match && !/^\d+$/.test(match[1].trim())) {
    return parsed(match[2], null, match[1]);
  }

  // Plain ID or plain nickname.
  match = /^(\d{3,20})$/.exec(raw);
  if (match) return parsed(match[1], null, null);

  return parsed(null, null, raw);
}

function parseAccountInput(input, zoneArg) {
  let result;
  if (isPlainObject(input)) {
    result = parseAccountObject(input);
  } else if (typeof input === 'number') {
    result = parsed(input, null, null);
  } else {
    result = parseAccountString(input);
  }
  if (zoneArg !== undefined && zoneArg !== null && typeof zoneArg !== 'object') {
    result = { ...result, zone: String(zoneArg).trim() };
  }
  return result;
}

function parseAccountObject(input) {
  const fromNested =
    isPlainObject(input.account)
      ? parseAccountObject(input.account)
      : typeof input.account === 'string'
        ? parseAccountString(input.account)
        : parsed(null, null, null);
  const fromQuery =
    typeof input.query === 'string'
      ? parseAccountString(input.query)
      : typeof input.input === 'string'
        ? parseAccountString(input.input)
        : parsed(null, null, null);

  return parsed(
    firstDefined(input.id, input.userId, input.user_id, input.userid, input.roleId, input.role_id, fromNested.id, fromQuery.id),
    firstDefined(input.zone, input.zoneId, input.zone_id, input.server, input.serverId, input.server_id, fromNested.zone, fromQuery.zone),
    firstDefined(input.nickname, input.name, input.username, fromNested.nickname, fromQuery.nickname)
  );
}

function validateAccount(raw) {
  const errors = [];
  const rawId = raw && raw.id != null ? String(raw.id).trim() : '';
  const rawZone = raw && raw.zone != null ? String(raw.zone).trim() : '';
  const rawNickname = raw && raw.nickname != null ? String(raw.nickname) : '';

  let id = null;
  let zone = null;
  let nickname = cleanNickname(rawNickname);

  if (!rawId) {
    if (nickname) {
      errors.push(
        `NICKNAME_SEARCH_UNAVAILABLE: Cannot resolve "${truncate(nickname, 60)}" by nickname. ` +
          'No free public MLBB endpoint searches by nickname, and this tool does not guess or fabricate an account. ' +
          'Supply the numeric User ID and Zone ID instead (for example: 134972929 2687).'
      );
    } else {
      errors.push(
        'MISSING_USER_ID: A numeric Mobile Legends User ID is required. ' +
          'Supply it directly or with --id.'
      );
    }
  } else if (!ID_PATTERN.test(rawId)) {
    errors.push(`INVALID_USER_ID: User ID must contain 3-20 digits (received: ${truncate(rawId, 40)}).`);
  } else {
    id = rawId;
  }

  if (!rawZone) {
    if (rawId) {
      errors.push(
        'MISSING_ZONE_ID: A numeric Zone ID is required (for example: 2687). ' +
          'The zone is shown next to the User ID in the MLBB profile.'
      );
    }
  } else if (!ZONE_PATTERN.test(rawZone)) {
    errors.push(`INVALID_ZONE_ID: Zone ID must contain 1-6 digits (received: ${truncate(rawZone, 40)}).`);
  } else {
    zone = rawZone;
  }

  if (rawNickname && Array.from(rawNickname).length > MAX_NICKNAME_LENGTH) {
    errors.push(`INVALID_NICKNAME: Nickname is longer than ${MAX_NICKNAME_LENGTH} characters.`);
  }

  return {
    id,
    zone,
    nickname,
    raw: {
      id: rawId || null,
      zone: rawZone || null,
      nickname: nickname || null
    },
    errors
  };
}

function parseTimeoutMs(value) {
  if (value == null || value === '') return { value: DEFAULT_TIMEOUT_MS, error: null };
  let ms;
  if (typeof value === 'number') {
    ms = value;
  } else {
    const match = /^(\d+(?:\.\d+)?)\s*(ms|s)?$/i.exec(String(value).trim());
    if (!match) {
      return { value: null, error: `INVALID_TIMEOUT: Use milliseconds (10000) or seconds (10s), received "${truncate(value, 40)}".` };
    }
    ms = Number(match[1]) * (match[2] && match[2].toLowerCase() === 's' ? 1000 : 1);
  }
  if (!Number.isFinite(ms) || ms < 1 || ms > MAX_TIMEOUT_MS) {
    return { value: null, error: `INVALID_TIMEOUT: Timeout must be between 1 and ${MAX_TIMEOUT_MS} ms.` };
  }
  return { value: Math.round(ms), error: null };
}

function parseRetries(value) {
  if (value == null || value === '') return { value: DEFAULT_RETRIES, error: null };
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > MAX_RETRIES) {
    return { value: null, error: `INVALID_RETRIES: Retries must be an integer from 0 to ${MAX_RETRIES}.` };
  }
  return { value: n, error: null };
}

/* --------------------------------------------------------------------------
 * HTTP
 * ----------------------------------------------------------------------- */

class ProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ProviderError';
    this.kind = options.kind || 'provider_error';
    this.status = options.status || null;
    this.provider = options.provider || null;
    this.retryable = Boolean(options.retryable);
    this.cause = options.cause || null;
  }
}

function describeFetchError(error) {
  const cause = error && error.cause;
  const code = (cause && cause.code) || (error && error.code);
  const message = (cause && cause.message) || (error && error.message) || String(error);
  if (code && !String(message).includes(code)) return `${code}: ${message}`;
  return message;
}

async function readBody(response) {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new ProviderError(`Response body is too large (${contentLength} bytes).`, {
      kind: 'invalid_response'
    });
  }
  const text = await response.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new ProviderError('Response body exceeded the allowed size.', {
      kind: 'invalid_response'
    });
  }
  return text;
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status === 500 ||
    status === 502 || status === 503 || status === 504;
}

function looksNotFound(status, message, json) {
  const combined = [
    message,
    json && json.message,
    json && json.error,
    json && json.msg
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (status === 404) return json !== null;
  if (!/not found|not recognized|invalid user account|user account is not recognized|tidak ditemukan|tidak terdaftar|akun tidak/.test(combined)) {
    return false;
  }
  return status === 200 || status === 400 || status === 422 || status === 404;
}

async function requestJson({ url, init, timeoutMs, retries, fetchImpl, provider }) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        ...init,
        signal: controller.signal,
        redirect: 'follow',
        credentials: 'omit',
        cache: 'no-store'
      });

      const text = await readBody(response);
      const json = parseJson(text);

      if (!response.ok) {
        const message = extractApiMessage(json, text) || `HTTP ${response.status}`;
        const notFound = looksNotFound(response.status, message, json);
        throw new ProviderError(message, {
          kind: notFound ? 'not_found' : response.status === 400 || response.status === 422 ? 'invalid_request' : 'http_error',
          status: response.status,
          provider,
          retryable: !notFound && isRetryableStatus(response.status)
        });
      }

      if (json === null) {
        throw new ProviderError(
          extractApiMessage(null, text) || 'Response was not valid JSON.',
          { kind: 'invalid_response', status: response.status, provider, retryable: false }
        );
      }

      return { json, status: response.status, text };
    } catch (error) {
      let normalized;

      if (error instanceof ProviderError) {
        normalized = error;
        if (!normalized.provider) normalized.provider = provider;
      } else if (controller.signal.aborted) {
        normalized = new ProviderError(`Request timed out after ${timeoutMs} ms.`, {
          kind: 'timeout',
          provider,
          retryable: false,
          cause: error
        });
      } else {
        normalized = new ProviderError(`Network error: ${describeFetchError(error)}`, {
          kind: 'network',
          provider,
          retryable: true,
          cause: error
        });
      }

      lastError = normalized;

      if (attempt >= retries || !normalized.retryable) {
        throw normalized;
      }

      await delay(250 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new ProviderError('Unknown provider error.', { provider });
}

/* --------------------------------------------------------------------------
 * Providers
 * ----------------------------------------------------------------------- */

function providerFailure(json, provider) {
  if (json && json.success === false) {
    const message = extractApiMessage(json, '') || 'Provider reported failure.';
    throw new ProviderError(message, {
      kind: looksNotFound(200, message, json) ? 'not_found' : 'provider_error',
      provider,
      retryable: false
    });
  }
}

function assertSameAccount(json, ctx, provider) {
  if (!json || typeof json !== 'object') return;
  if (json.id != null && String(json.id) !== ctx.id) {
    throw new ProviderError(
      `Provider returned a different User ID (${truncate(json.id, 30)}) for the requested ID.`,
      { kind: 'identity_mismatch', provider, retryable: false }
    );
  }
  if (json.zone != null && String(json.zone) !== ctx.zone) {
    throw new ProviderError(
      `Provider returned a different Zone ID (${truncate(json.zone, 30)}).`,
      { kind: 'identity_mismatch', provider, retryable: false }
    );
  }
  if (json.server != null && String(json.server) !== ctx.zone) {
    throw new ProviderError(
      `Provider returned a different server/zone (${truncate(json.server, 30)}).`,
      { kind: 'identity_mismatch', provider, retryable: false }
    );
  }
}

function extractCountry(json) {
  let code = null;
  let name = null;

  const codeCandidates = [
    json && json.countryCode,
    json && json.country_code,
    json && json.countryOrigin,
    json && json.country_origin,
    json && json.country
  ];
  for (const candidate of codeCandidates) {
    const normalized = normalizeCountryCode(candidate);
    if (normalized) {
      code = normalized;
      break;
    }
  }

  const nameCandidates = [
    json && json.countryName,
    json && json.country_name,
    json && json.country,
    json && json.region
  ];
  for (const candidate of nameCandidates) {
    if (typeof candidate === 'string' && candidate.trim() && !normalizeCountryCode(candidate)) {
      name = cleanText(candidate, 100);
      break;
    }
  }

  if (!name && code) name = countryNameFromCode(code);
  if (!code && name) code = countryCodeFromName(name);

  return { country: name || null, countryCode: code || null };
}

async function lookupIsanFind(ctx) {
  const provider = 'mlbb-api.isan.eu.org';
  const url = new URL(ENDPOINTS.isanFind);
  url.searchParams.set('id', ctx.id);
  url.searchParams.set('zone', ctx.zone);

  const { json } = await requestJson({
    url: url.toString(),
    init: {
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8',
        'user-agent': ctx.userAgent
      }
    },
    timeoutMs: ctx.timeout,
    retries: ctx.retries,
    fetchImpl: ctx.fetchImpl,
    provider
  });

  providerFailure(json, provider);
  assertSameAccount(json, ctx, provider);

  const nickname = cleanNickname(json && (json.name || json.nickname || json.username));
  if (!nickname) {
    throw new ProviderError('Response did not include a nickname.', {
      kind: 'invalid_response',
      provider,
      retryable: false
    });
  }

  return { provider, nickname, ...extractCountry(json) };
}

async function lookupIsanNickname(ctx) {
  const provider = 'api.isan.eu.org';
  const url = new URL(ENDPOINTS.isanNickname);
  url.searchParams.set('id', ctx.id);
  url.searchParams.set('zone', ctx.zone);

  const { json } = await requestJson({
    url: url.toString(),
    init: {
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8',
        'user-agent': ctx.userAgent
      }
    },
    timeoutMs: ctx.timeout,
    retries: ctx.retries,
    fetchImpl: ctx.fetchImpl,
    provider
  });

  providerFailure(json, provider);
  assertSameAccount(json, ctx, provider);

  const nickname = cleanNickname(json && (json.name || json.nickname || json.username));
  if (!nickname) {
    throw new ProviderError('Response did not include a nickname.', {
      kind: 'invalid_response',
      provider,
      retryable: false
    });
  }

  return { provider, nickname, ...extractCountry(json) };
}

async function lookupGoPay(ctx) {
  const provider = 'gopay.co.id';
  const { json } = await requestJson({
    url: ENDPOINTS.gopay,
    init: {
      method: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8',
        'content-type': 'application/json',
        origin: 'https://gopay.co.id',
        referer: 'https://gopay.co.id/',
        'user-agent': ctx.userAgent
      },
      body: JSON.stringify({
        code: 'MOBILE_LEGENDS',
        data: { userId: ctx.id, zoneId: ctx.zone }
      })
    },
    timeoutMs: ctx.timeout,
    retries: ctx.retries,
    fetchImpl: ctx.fetchImpl,
    provider
  });

  const data = json && json.data;
  if (!data || data.username == null) {
    const message = extractApiMessage(json, '') || 'Response did not include a username.';
    throw new ProviderError(message, {
      kind: /not recognized|invalid user account|not found/i.test(message) ? 'not_found' : 'invalid_response',
      provider,
      retryable: false
    });
  }

  const rawNickname = decodeFormComponent(data.username);
  const nickname = cleanNickname(rawNickname);
  if (!nickname) {
    throw new ProviderError('Response included an empty username.', {
      kind: 'invalid_response',
      provider,
      retryable: false
    });
  }

  return {
    provider,
    nickname,
    ...extractCountry({ countryOrigin: data.countryOrigin })
  };
}

const PROVIDERS = [
  { id: 'isan-find', label: 'mlbb-api.isan.eu.org', priority: 1, lookup: lookupIsanFind },
  { id: 'isan-nickname', label: 'api.isan.eu.org', priority: 2, lookup: lookupIsanNickname },
  { id: 'gopay', label: 'gopay.co.id', priority: 3, lookup: lookupGoPay }
];

async function lookupAll(ctx) {
  const settled = await Promise.allSettled(
    PROVIDERS.map(async (provider) => {
      const identity = await provider.lookup(ctx);
      return {
        ...identity,
        providerId: provider.id,
        priority: provider.priority
      };
    })
  );

  const successes = [];
  const failures = [];

  settled.forEach((entry, index) => {
    const provider = PROVIDERS[index];
    if (entry.status === 'fulfilled' && entry.value && entry.value.nickname) {
      successes.push(entry.value);
      return;
    }
    const reason = entry.status === 'rejected'
      ? entry.reason
      : new ProviderError('Provider returned no identity.', {
          provider: provider.label,
          retryable: false
        });
    const error = reason instanceof ProviderError
      ? reason
      : new ProviderError(reason && reason.message ? reason.message : String(reason), {
          provider: provider.label,
          retryable: false
        });
    if (!error.provider) error.provider = provider.label;
    failures.push({ provider, error });
  });

  return { successes, failures };
}

/* --------------------------------------------------------------------------
 * Result building
 * ----------------------------------------------------------------------- */

function createResult() {
  return {
    status: 'failed',
    game: GAME,
    scraped_at: new Date().toISOString()
  };
}

function mergeIdentity(successes, requestedNickname) {
  const sorted = successes
    .slice()
    .sort((a, b) => a.priority - b.priority || String(a.provider).localeCompare(String(b.provider)));

  const primary = sorted[0];
  const warnings = [];

  const nicknameKeys = new Set();
  for (const success of sorted) {
    if (success.nickname) nicknameKeys.add(normalizeIdentity(success.nickname));
  }
  if (nicknameKeys.size > 1) {
    warnings.push(
      `IDENTITY_MISMATCH: Providers returned different nicknames (${sorted
        .map((item) => `${item.provider}: ${truncate(item.nickname, 40)}`)
        .join('; ')}).`
    );
  }

  const codes = new Set();
  let countryCode = null;
  let country = null;
  for (const success of sorted) {
    if (success.countryCode) {
      codes.add(success.countryCode);
      if (!countryCode) countryCode = success.countryCode;
    }
    if (success.country && !country) country = success.country;
  }
  if (!country && countryCode) country = countryNameFromCode(countryCode);
  if (!countryCode && country) countryCode = countryCodeFromName(country);

  if (codes.size > 1) {
    warnings.push(
      `IDENTITY_MISMATCH: Providers returned different country codes (${Array.from(codes).join(', ')}); ` +
        'country fields were omitted because they could not be verified consistently.'
    );
    country = null;
    countryCode = null;
  }

  if (requestedNickname && normalizeIdentity(requestedNickname) !== normalizeIdentity(primary.nickname)) {
    warnings.push(
      `NICKNAME_MISMATCH: The supplied nickname "${truncate(requestedNickname, 40)}" does not match ` +
        `the resolved nickname "${truncate(primary.nickname, 40)}". The User ID and Zone ID were treated as authoritative.`
    );
  }

  return {
    primary,
    nickname: primary.nickname,
    country,
    countryCode,
    warnings
  };
}

function applyIdentity(result, merged, request) {
  const account = {
    id: String(request.id),
    zone: String(request.zone),
    nickname: merged.nickname
  };

  // Only include country fields that a provider actually returned. A verified
  // public profile URL was not found for arbitrary accounts, so profile_url is
  // omitted entirely rather than emitted as null.
  if (merged.country) account.country = merged.country;
  if (merged.countryCode) account.country_code = merged.countryCode;

  account.found = true;
  account.verified = true;

  result.account = account;

  if (merged.warnings.length) {
    result.errors = [...merged.warnings];
    result.status = 'partial';
  } else {
    result.status = 'success';
  }
}

function applyFailure(result, failures, request) {
  result.status = 'failed';
  result.errors = [];

  const primaryFailure = failures.find((item) => item.provider.priority === 1);
  const allNotFound = failures.length > 0 && failures.every((item) => item.error.kind === 'not_found');
  const allTimeout = failures.length > 0 && failures.every((item) => item.error.kind === 'timeout');

  if (allNotFound || (primaryFailure && primaryFailure.error.kind === 'not_found')) {
    result.errors.push(
      `ACCOUNT_NOT_FOUND: No Mobile Legends account matched User ID ${truncate(request.id, 30)} ` +
        `(Zone ${truncate(request.zone, 20)}). Verify both IDs; the Zone ID is not the same as the server region.`
    );
  } else if (allTimeout) {
    result.errors.push(
      `LOOKUP_TIMEOUT: All public lookup providers timed out. The network may be slow or the endpoints may be down.`
    );
  } else {
    result.errors.push(
      `LOOKUP_FAILED: The account could not be verified with any public provider. See PROVIDER_FAILED entries for details.`
    );
  }

  const seen = new Set();
  for (const { provider, error } of failures) {
    const status = error.status ? ` HTTP ${error.status}` : '';
    const line = `PROVIDER_FAILED: ${provider.label} [${error.kind}${status}]: ${truncate(error.message, 200)}`;
    if (!seen.has(line)) {
      seen.add(line);
      result.errors.push(line);
    }
  }
}

function normalizeOptions(options = {}) {
  const errors = [];
  const timeout = parseTimeoutMs(options.timeout);
  if (timeout.error) errors.push(timeout.error);
  const retries = parseRetries(options.retries);
  if (retries.error) errors.push(retries.error);

  const fetchImpl = options.fetch || options.fetchImpl || (typeof globalThis.fetch === 'function' ? globalThis.fetch : null);
  if (typeof fetchImpl !== 'function') {
    errors.push('RUNTIME_UNSUPPORTED: Node.js 18+ (global fetch) is required, or pass a fetch implementation in options.fetch.');
  }

  return {
    timeout: timeout.value == null ? DEFAULT_TIMEOUT_MS : timeout.value,
    retries: retries.value == null ? DEFAULT_RETRIES : retries.value,
    fetchImpl: typeof fetchImpl === 'function' ? fetchImpl : null,
    userAgent: options.userAgent ? truncate(options.userAgent, 200) : USER_AGENT,
    errors
  };
}

function normalizeScrapeArgs(input, zoneArg, optionsArg) {
  let raw;
  let options = {};
  let explicit = {};

  if (isPlainObject(input)) {
    raw = parseAccountObject(input);
    if (zoneArg !== undefined && zoneArg !== null && typeof zoneArg !== 'object') {
      raw.zone = String(zoneArg).trim();
    }
    if (isPlainObject(zoneArg)) options = { ...zoneArg };
    if (isPlainObject(optionsArg)) options = { ...options, ...optionsArg };
    options = { ...input, ...options };
    explicit = {
      id: firstDefined(input.id, input.userId, input.user_id),
      zone: firstDefined(input.zone, input.zoneId, input.zone_id, input.server),
      nickname: firstDefined(input.nickname, input.name, input.username)
    };
  } else if (isPlainObject(zoneArg)) {
    raw = parseAccountInput(input);
    options = { ...zoneArg };
    explicit = { id: zoneArg.id, zone: zoneArg.zone, nickname: zoneArg.nickname };
  } else {
    raw = parseAccountInput(input, zoneArg);
    options = isPlainObject(optionsArg) ? { ...optionsArg } : {};
    explicit = { id: options.id, zone: options.zone, nickname: options.nickname };
  }

  if (explicit.id != null && explicit.id !== '') raw.id = String(explicit.id).trim();
  if (explicit.zone != null && explicit.zone !== '') raw.zone = String(explicit.zone).trim();
  if (explicit.nickname != null && explicit.nickname !== '') raw.nickname = cleanNickname(explicit.nickname);

  const account = validateAccount(raw);
  const normalizedOptions = normalizeOptions(options);

  return {
    account,
    options: normalizedOptions,
    errors: [...account.errors, ...normalizedOptions.errors]
  };
}

async function scrapeStalkML(input, zoneArg, optionsArg) {
  const normalized = normalizeScrapeArgs(input, zoneArg, optionsArg);
  const request = normalized.account.raw;
  const result = createResult();

  if (normalized.errors.length) {
    result.errors = [...normalized.errors];
    return result;
  }

  const ctx = {
    id: normalized.account.id,
    zone: normalized.account.zone,
    timeout: normalized.options.timeout,
    retries: normalized.options.retries,
    fetchImpl: normalized.options.fetchImpl,
    userAgent: normalized.options.userAgent
  };

  try {
    const lookup = await lookupAll(ctx);
    if (lookup.successes.length === 0) {
      applyFailure(result, lookup.failures, request);
      return result;
    }

    const merged = mergeIdentity(lookup.successes, normalized.account.nickname);
    applyIdentity(result, merged, request);
    return result;
  } catch (error) {
    result.status = 'failed';
    result.errors = [
      `LOOKUP_FAILED: Unexpected error while querying public providers: ${truncate(error && error.message ? error.message : error, 240)}`
    ];
    return result;
  }
}

/* --------------------------------------------------------------------------
 * Output
 * ----------------------------------------------------------------------- */

function formatJson(result, compact = false) {
  return JSON.stringify(result, null, compact ? 0 : 2);
}

function writeResult(result, outFile = DEFAULT_OUT) {
  if (!outFile || outFile === '-') return null;
  const target = path.resolve(String(outFile));
  const directory = path.dirname(target);
  fs.mkdirSync(directory, { recursive: true });

  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temp, `${formatJson(result, false)}\n`, 'utf8');
    fs.renameSync(temp, target);
  } finally {
    try {
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
    } catch {
      // Best-effort cleanup only.
    }
  }

  return target;
}

/* --------------------------------------------------------------------------
 * CLI
 * ----------------------------------------------------------------------- */

function readOptionValue(argv, index, name, errors) {
  const next = argv[index + 1];
  if (next === undefined || (next.startsWith('-') && next !== '-')) {
    errors.push(`OPTION_MISSING_VALUE: ${name} requires a value.`);
    return { value: null, nextIndex: index };
  }
  return { value: next, nextIndex: index + 1 };
}

function parseCli(argv) {
  const errors = [];
  const positionals = [];
  const flags = {};
  const options = {
    timeout: DEFAULT_TIMEOUT_MS,
    retries: DEFAULT_RETRIES,
    out: DEFAULT_OUT,
    quiet: false,
    compact: false
  };
  let help = false;
  let version = false;
  let noWrite = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i]);

    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (arg === '-h' || arg === '--help') {
      help = true;
      continue;
    }
    if (arg === '--version' || arg === '-V') {
      version = true;
      continue;
    }
    if (arg === '-q' || arg === '--quiet') {
      options.quiet = true;
      continue;
    }
    if (arg === '--compact') {
      options.compact = true;
      continue;
    }
    if (arg === '--no-write') {
      noWrite = true;
      continue;
    }
    if (arg === '-o' || arg === '--out') {
      const read = readOptionValue(argv, i, arg, errors);
      i = read.nextIndex;
      if (read.value != null) options.out = read.value;
      continue;
    }
    if (arg.startsWith('--out=')) {
      options.out = arg.slice('--out='.length);
      if (!options.out) errors.push('OPTION_MISSING_VALUE: --out requires a value.');
      continue;
    }
    if (arg === '--timeout') {
      const read = readOptionValue(argv, i, arg, errors);
      i = read.nextIndex;
      if (read.value != null) options.timeout = read.value;
      continue;
    }
    if (arg.startsWith('--timeout=')) {
      options.timeout = arg.slice('--timeout='.length);
      continue;
    }
    if (arg === '--retries') {
      const read = readOptionValue(argv, i, arg, errors);
      i = read.nextIndex;
      if (read.value != null) options.retries = read.value;
      continue;
    }
    if (arg.startsWith('--retries=')) {
      options.retries = arg.slice('--retries='.length);
      continue;
    }
    if (arg === '--id' || arg === '--user-id' || arg === '-i') {
      const read = readOptionValue(argv, i, arg, errors);
      i = read.nextIndex;
      if (read.value != null) flags.id = read.value;
      continue;
    }
    if (arg.startsWith('--id=')) {
      flags.id = arg.slice('--id='.length);
      continue;
    }
    if (arg === '--zone' || arg === '--server' || arg === '-z') {
      const read = readOptionValue(argv, i, arg, errors);
      i = read.nextIndex;
      if (read.value != null) flags.zone = read.value;
      continue;
    }
    if (arg.startsWith('--zone=')) {
      flags.zone = arg.slice('--zone='.length);
      continue;
    }
    if (arg === '--nickname' || arg === '--name' || arg === '-n') {
      const read = readOptionValue(argv, i, arg, errors);
      i = read.nextIndex;
      if (read.value != null) flags.nickname = read.value;
      continue;
    }
    if (arg.startsWith('--nickname=')) {
      flags.nickname = arg.slice('--nickname='.length);
      continue;
    }
    if (arg.startsWith('-') && arg !== '-') {
      errors.push(`UNKNOWN_OPTION: ${arg}`);
      continue;
    }

    positionals.push(arg);
  }

  if (noWrite) options.out = '-';

  const timeout = parseTimeoutMs(options.timeout);
  if (timeout.error) errors.push(timeout.error);
  options.timeout = timeout.value == null ? DEFAULT_TIMEOUT_MS : timeout.value;

  const retries = parseRetries(options.retries);
  if (retries.error) errors.push(retries.error);
  options.retries = retries.value == null ? DEFAULT_RETRIES : retries.value;

  const positional = parseAccountString(positionals.join(' '));
  const raw = {
    id: positional.id,
    zone: positional.zone,
    nickname: positional.nickname
  };

  if (flags.id !== undefined) {
    if (raw.id && String(raw.id) !== String(flags.id).trim()) {
      errors.push(
        `CONFLICTING_USER_ID: Positional input contains ${truncate(raw.id, 30)} but --id is ${truncate(flags.id, 30)}.`
      );
    }
    raw.id = flags.id;
  }
  if (flags.zone !== undefined) {
    if (raw.zone && String(raw.zone) !== String(flags.zone).trim()) {
      errors.push(
        `CONFLICTING_ZONE_ID: Positional input contains ${truncate(raw.zone, 30)} but --zone is ${truncate(flags.zone, 30)}.`
      );
    }
    raw.zone = flags.zone;
  }
  if (flags.nickname !== undefined) raw.nickname = flags.nickname;

  const account = validateAccount(raw);
  errors.push(...account.errors);

  return {
    help,
    version,
    input: account.raw,
    options,
    errors
  };
}

function printHelp() {
  const text = `mlbb-stalker ${VERSION} - public MLBB account lookup

Usage:
  node scrape-stalkml.js <userId> <zoneId> [options]
  node scrape-stalkml.js "<userId> (<zoneId>)" [options]
  node scrape-stalkml.js --id <userId> --zone <zoneId> [options]

Accepted input examples:
  134972929 2687
  "134972929 (2687)"
  "134972929|2687"
  "134972929:2687"
  "TIKUS BANGKET" 134972929 2687
  134972929 2687 "TIKUS BANGKET"
  "RazeerhNarh:3" 12345678
  "RazeerhNarh:134972929" --zone 2687
  "RazeerhNarh :3"            (nickname query; not resolvable)

Options:
  -i, --id <id>           MLBB User ID (overrides positional ID)
  -z, --zone <zone>       MLBB Zone ID (overrides positional zone)
  -n, --nickname <name>   Optional nickname label, used for verification
      --timeout <time>    Request timeout: ms or seconds (default: 10000 ms)
      --retries <n>       Retries per provider, 0-3 (default: 1)
  -o, --out <file>        Output JSON file (default: result.json; "-" = no file)
      --no-write          Do not write a JSON file
  -q, --quiet             Do not print JSON to stdout
      --compact           Print compact JSON instead of pretty JSON
  -h, --help              Show this help
  -V, --version           Show version

Notes:
  - A successful result contains only verified identity fields: id, zone,
    nickname, and country/country_code when a provider returned them.
  - Nickname-only queries are parsed but return NICKNAME_SEARCH_UNAVAILABLE:
    no free public MLBB endpoint searches by nickname. The numeric User ID and
    Zone ID are required.
  - No tokens, cookies or browser engine are required.

Module:
  const { scrapeStalkML } = require('./scrape-stalkml');
  const result = await scrapeStalkML({ id: '134972929', zone: '2687' });
`;
  process.stdout.write(text);
}

async function runCli(argv) {
  const parsed = parseCli(argv);

  if (parsed.help) {
    printHelp();
    return 0;
  }
  if (parsed.version) {
    process.stdout.write(`mlbb-stalker ${VERSION}\n`);
    return 0;
  }

  let result;
  let exitCode = 0;

  if (parsed.errors.length) {
    result = createResult();
    result.errors = [...parsed.errors];
    exitCode = 2;
    process.stderr.write('Input error. Run with --help for usage.\n');
  } else {
    result = await scrapeStalkML(parsed.input, {
      timeout: parsed.options.timeout,
      retries: parsed.options.retries
    });
    exitCode = result.status === 'failed' ? 1 : 0;
  }

  if (parsed.options.out && parsed.options.out !== '-') {
    try {
      writeResult(result, parsed.options.out);
    } catch (error) {
      result.errors = [
        ...(result.errors || []),
        `RESULT_WRITE_FAILED: Could not write ${parsed.options.out}: ${truncate(error && error.message ? error.message : error, 200)}`
      ];
      if (result.status !== 'failed') result.status = 'partial';
      exitCode = 1;
      if (parsed.options.quiet) {
        process.stderr.write(`Could not write ${parsed.options.out}.\n`);
      }
    }
  }

  if (!parsed.options.quiet) {
    process.stdout.write(`${formatJson(result, parsed.options.compact)}\n`);
  }

  return exitCode;
}

/* --------------------------------------------------------------------------
 * Exports
 * ----------------------------------------------------------------------- */

function parseInput(input, zone) {
  let raw = isPlainObject(input) ? parseAccountObject(input) : parseAccountInput(input, zone);
  if (isPlainObject(input) && zone !== undefined && zone !== null && typeof zone !== 'object') {
    raw = { ...raw, zone: String(zone).trim() };
  }
  return validateAccount(raw);
}

module.exports = scrapeStalkML;
module.exports.scrapeStalkML = scrapeStalkML;
module.exports.parseInput = parseInput;
module.exports.parseCli = parseCli;
module.exports.parseAccountString = parseAccountString;
module.exports.createResult = createResult;
module.exports.writeResult = writeResult;
module.exports.formatJson = formatJson;
module.exports.VERSION = VERSION;
module.exports.DEFAULT_OUT = DEFAULT_OUT;

if (require.main === module) {
  process.stdout.on('error', (error) => {
    if (error && error.code === 'EPIPE') process.exit(0);
  });

  runCli(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      const result = createResult();
      result.errors = [
        `UNEXPECTED_ERROR: ${truncate(error && error.message ? error.message : error, 300)}`
      ];
      try {
        writeResult(result, DEFAULT_OUT);
      } catch {
        // Nothing else we can do.
      }
      process.stdout.write(`${formatJson(result, false)}\n`);
      process.exitCode = 1;
    });
}
