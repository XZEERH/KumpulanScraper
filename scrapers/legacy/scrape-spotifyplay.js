#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Play Musik
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://spotmp3.net
 * Type : Scraper
 * Description : Intinya spotify play, dari mencari lagu berdasarkan query/judul, kemudian menampilkan hasil pencarian yang bisa diputar atau diunduh dalam format MP3.
 * Note : Hasil Pencarian nya lengkap banget tinggal disesuaikan aja, sedikit informasi bagian album hanya terisi jika dikembalikan API, soalnya sering (null), (result_page_url) jika memang tidak tersedia, Url mp3 kadaluwarsa 24jam, btw error fix sendiri
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const axios = require('axios');

process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0);
});

const VERSION = '1.0.0';
const SITE_ORIGIN = 'https://spotmp3.net';
const API_BASE = 'https://spotmp3.net/api/v1';
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const TERMINAL_JOB_STATUSES = new Set(['completed', 'partial', 'failed', 'cancelled']);
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_AUDIO_TRACKS = 30;
const MAX_SEARCH_LIMIT = 50;
const MAX_SEARCH_PAGES = 10;
const MAX_BATCH_SIZE = 3;

const VERSION_RULES = [
  { key: 'remix', pattern: /\b(remix|rmx|bootleg|flip)\b/ },
  { key: 'slowed', pattern: /\b(slowed|ultra\s*slowed|reverb)\b/ },
  { key: 'sped_up', pattern: /\b(sped\s*up|speed\s*up|nightcore)\b/ },
  { key: 'live', pattern: /\b(live|concert|session)\b/ },
  { key: 'acoustic', pattern: /\b(acoustic|unplugged)\b/ },
  { key: 'instrumental', pattern: /\b(instrumental|karaoke|backing\s*track)\b/ },
  { key: 'cover', pattern: /\b(cover|tribute)\b/ },
  { key: 'hardtekk', pattern: /\b(hardtekk|hard\s*techno|hardstyle)\b/ },
  { key: 'tiktok', pattern: /\b(tiktok|tik\s*tok)\b/ },
  { key: 'extended', pattern: /\b(extended|club\s*mix)\b/ },
  { key: 'radio_edit', pattern: /\b(radio\s*edit|single\s*version)\b/ },
  { key: 'remaster', pattern: /\b(remaster|remastered)\b/ },
  { key: 'demo', pattern: /\bdemo\b/ },
  { key: 'edit', pattern: /\bedit\b/ }
];

const AUDIO_ERROR_MESSAGES = {
  no_match: 'No suitable audio source match was found.',
  unavailable: 'Audio is not available for this track.',
  age_restricted: 'The audio source is age-restricted.',
  bot_block: 'The audio source blocked the request with bot protection.',
  region_blocked: 'The audio source is unavailable in this region.',
  download_refused: 'The audio source refused the download.',
  timeout: 'Audio preparation timed out.',
  egress_exhausted: 'The server has no download allowance left.',
  ffmpeg: 'Audio conversion failed.',
  missing_file: 'The job finished without producing an MP3 file.',
  breaker_skip: 'The job stopped early after repeated failures.',
  quota_exhausted: 'The free daily allowance for audio preparation is exhausted.',
  quota_dropped: 'The track was dropped from the job by a quota or server limit.',
  not_returned: 'The job did not return data for this track.',
  job_timeout: 'The audio job did not finish before the timeout.',
  network: 'The audio service could not be reached.',
  rate_limited: 'The audio service is rate limiting requests.',
  supporter_required: 'The server requires the supporter path for this batch.',
  server_error: 'The audio service returned an error.'
};

class ScrapeError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ScrapeError';
    this.code = options.code || 'scraper_error';
    this.status = options.status || 0;
    this.details = options.details || {};
    this.retryAfter = options.retryAfter ?? null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function safeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return null;
  const totalSeconds = Math.round(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parseBitrateKbps(value) {
  if (!value) return null;
  const match = String(value).match(/(\d{2,4})/);
  return match ? Number(match[1]) : null;
}

function unixToIso(value) {
  const number = safeNumber(value);
  if (!number || number <= 0) return null;
  return new Date(number * 1000).toISOString();
}

function toAbsoluteUrl(value, origin) {
  if (!value) return null;
  try {
    return new URL(value, origin).toString();
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 1);
}

function detectVersion(title) {
  const normalized = ` ${normalizeText(title)} `;
  const tags = [];
  for (const rule of VERSION_RULES) {
    if (rule.pattern.test(normalized) && !tags.includes(rule.key)) tags.push(rule.key);
  }
  return tags.length ? tags : ['original'];
}

function computeMatch(query, title, artist) {
  const queryNormalized = normalizeText(query);
  const titleNormalized = normalizeText(title);
  const artistNormalized = normalizeText(artist);
  const queryTokens = tokenize(query);
  const titleTokens = new Set(tokenize(title));
  const artistTokens = tokenize(artist);
  let score = 0;

  if (queryNormalized && titleNormalized) {
    if (titleNormalized === queryNormalized) {
      score = 1;
    } else if (titleNormalized.includes(queryNormalized)) {
      score = 0.95;
    } else if (queryNormalized.includes(titleNormalized)) {
      score = 0.9;
    } else if (queryTokens.length) {
      const hits = queryTokens.filter((token) => titleTokens.has(token)).length;
      score = (hits / queryTokens.length) * 0.8;
    }
  }

  if (artistNormalized && artistTokens.length) {
    const artistHits = artistTokens.filter((token) => queryNormalized.includes(token)).length;
    score = Math.min(1, score + (artistHits / artistTokens.length) * 0.15);
  }

  const rounded = Number(score.toFixed(2));
  return {
    score: rounded,
    confidence: rounded >= 0.85 ? 'high' : rounded >= 0.55 ? 'medium' : 'low',
    query_tokens: queryTokens,
    title_tokens: [...titleTokens].slice(0, 25)
  };
}

function splitArtists(subtitle) {
  if (!subtitle) return [];
  return String(subtitle)
    .split(/\s*,\s*/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function parseRetryAfterSeconds(response, payload) {
  const header = response?.headers?.['retry-after'];
  if (header != null) {
    const numeric = Number(header);
    if (Number.isFinite(numeric) && numeric >= 0) return numeric;
    const date = Date.parse(String(header));
    if (Number.isFinite(date)) return Math.max(0, (date - Date.now()) / 1000);
  }
  const bodyValue = payload?.error?.details?.retry_after ?? payload?.details?.retry_after;
  const bodyNumber = safeNumber(bodyValue);
  if (Number.isFinite(bodyNumber) && bodyNumber >= 0) return bodyNumber;
  return null;
}

function retryDelayMs(error, attempt) {
  if (Number.isFinite(error.retryAfter) && error.retryAfter >= 0) {
    return Math.min(error.retryAfter * 1000, 60000);
  }
  return Math.min(1000 * 2 ** attempt + Math.floor(Math.random() * 250), 10000);
}

class SpotMP3Api {
  constructor(options) {
    this.origin = options.origin;
    this.baseUrl = options.apiBase.replace(/\/+$/, '');
    this.timeout = options.timeout;
    this.retries = options.retries;
    this.http = axios.create({
      timeout: this.timeout,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: `${this.origin}/`,
        Origin: this.origin
      }
    });
  }

  resolveUrl(endpoint) {
    if (/^https?:\/\//i.test(endpoint)) return endpoint;
    if (endpoint.startsWith('/api/')) {
      return new URL(endpoint, this.origin).toString();
    }
    const suffix = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${suffix}`;
  }

  async request(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const maxRetries = options.retries ?? this.retries;
    let attempt = 0;

    while (true) {
      let response;
      let payload;

      try {
        response = await this.http.request({
          url: this.resolveUrl(endpoint),
          method,
          data: options.data,
          headers: options.headers,
          signal: options.signal
        });
        payload = response.data;
      } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
        const isNetwork = ['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ECONNREFUSED', 'ERR_NETWORK'].includes(error.code);
        if (attempt < maxRetries && (isTimeout || isNetwork)) {
          const delay = 1000 * 2 ** attempt;
          await sleep(delay);
          attempt += 1;
          continue;
        }
        throw new ScrapeError(isTimeout ? `Request timed out after ${this.timeout} ms` : `Network request failed: ${error.message}`, {
          code: isTimeout ? 'timeout' : 'network',
          status: 0
        });
      }

      if (response.status >= 200 && response.status < 300) {
        return payload;
      }

      const apiError = payload?.error ?? {};
      const error = new ScrapeError(
        apiError.message || payload?.detail || `HTTP ${response.status}`,
        {
          code: apiError.code || `http_${response.status}`,
          status: response.status,
          details: apiError.details ?? {},
          retryAfter: parseRetryAfterSeconds(response, payload)
        }
      );

      if (attempt < maxRetries && RETRYABLE_STATUSES.has(response.status)) {
        await sleep(retryDelayMs(error, attempt));
        attempt += 1;
        continue;
      }

      throw error;
    }
  }

  async search(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      limit: String(options.limit),
      offset: String(options.offset)
    });
    return this.request(`/search?${params.toString()}`, { retries: options.retries ?? this.retries });
  }

  async createJob(trackUrls, title) {
    return this.request('/jobs', {
      method: 'POST',
      retries: 0,
      headers: { 'Content-Type': 'application/json' },
      data: {
        track_urls: trackUrls,
        title,
        lyrics: false
      }
    });
  }

  async getJob(jobUrl) {
    return this.request(jobUrl, { retries: 1 });
  }

  async cancelJob(jobUrl) {
    return this.request(jobUrl, { method: 'DELETE', retries: 0 });
  }
}

function extractTrackSection(payload) {
  const sections = Array.isArray(payload?.sections) ? payload.sections : [];
  const trackSection = sections.find((section) => section.type === 'track') ?? null;
  let items = Array.isArray(trackSection?.items) ? trackSection.items : [];
  if (!items.length && Array.isArray(payload?.items)) {
    items = payload.items.filter((item) => item?.type === 'track');
  }
  return {
    items: items.filter((item) => item && item.type === 'track' && item.id),
    total: safeNumber(trackSection?.total),
    nextOffset: safeNumber(trackSection?.next_offset) ?? safeNumber(payload?.next_offset)
  };
}

function summarizeSections(payload) {
  const summary = {};
  for (const section of payload?.sections ?? []) {
    if (!section?.type) continue;
    summary[section.type] = {
      total: safeNumber(section.total),
      returned: Array.isArray(section.items) ? section.items.length : 0,
      next_offset: safeNumber(section.next_offset)
    };
  }
  return summary;
}

async function fetchSearchPage(api, query, options) {
  return api.search(query, {
    limit: options.limit,
    offset: options.offset,
    retries: options.retries
  });
}

async function collectSearchResults(api, query, options) {
  const tracks = [];
  const seen = new Set();
  const warnings = [];
  let offset = options.offset;
  let pagesFetched = 0;
  let trackTotal = null;
  let sections = {};

  for (let pageIndex = 0; pageIndex < options.pages; pageIndex += 1) {
    let page;
    try {
      page = await fetchSearchPage(api, query, {
        limit: options.limit,
        offset,
        retries: options.retries
      });
    } catch (error) {
      if (pagesFetched > 0) {
        warnings.push({
          stage: 'search_page',
          message: `Search page ${pageIndex + 1} failed after earlier pages succeeded: ${error.message}`,
          code: error.code || 'search_page_failed'
        });
        break;
      }
      throw error;
    }

    pagesFetched += 1;
    sections = summarizeSections(page);
    const extracted = extractTrackSection(page);
    if (extracted.total != null) trackTotal = Math.max(trackTotal ?? 0, extracted.total);

    for (const item of extracted.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      tracks.push(item);
    }

    if (!extracted.items.length || extracted.nextOffset == null || extracted.nextOffset === offset) {
      break;
    }
    offset = extracted.nextOffset;
  }

  return {
    tracks,
    warnings,
    pagesFetched,
    trackTotal,
    sections,
    finalOffset: offset
  };
}

function emptyAudio(status, options = {}) {
  return {
    status,
    available: false,
    source: options.source ?? 'spotmp3_search',
    source_reference: options.sourceReference ?? null,
    job_source_url: null,
    file_id: null,
    file_url: null,
    format: null,
    bitrate: null,
    bitrate_kbps: null,
    size_bytes: null,
    size_human: null,
    filename: null,
    title: options.title ?? null,
    artist: options.artist ?? null,
    artists: options.artists ?? [],
    album: options.album ?? null,
    cover: options.cover ?? null,
    error: options.error ?? null,
    error_code: options.errorCode ?? null,
    failure_class: options.failureClass ?? null,
    from_cache: false,
    job_id: null,
    job_status: null,
    expires_at: null,
    lyrics_url: null,
    note: options.note ?? null
  };
}

function normalizeSearchTrack(item, query, index) {
  const title = item.title ? String(item.title).trim() : 'Unknown title';
  const artist = item.subtitle ? String(item.subtitle).trim() : null;
  const artists = splitArtists(artist);
  const durationMs = safeNumber(item.duration_ms);
  const cover = item.cover ?? null;
  const spotifyUrl = item.url || (item.id ? `https://open.spotify.com/track/${item.id}` : null);

  return {
    index,
    query,
    search_result_type: item.type ?? 'track',
    status: 'found',
    spotify_id: item.id ?? null,
    spotify_url: spotifyUrl,
    title,
    artist,
    artists,
    album: item.album ?? null,
    duration_ms: durationMs,
    duration: formatDuration(durationMs),
    thumbnail: cover,
    cover,
    result_page_url: null,
    result_page_note: 'SpotMP3 is a single-page app and does not expose a public page per track result.',
    version: detectVersion(title),
    match: computeMatch(query, title, artist),
    audio: emptyAudio('not_requested', {
      sourceReference: spotifyUrl,
      title,
      artist,
      artists,
      album: item.album ?? null,
      cover
    })
  };
}

function audioFailureFromError(error, result) {
  const code = error.code || 'server_error';
  const message = error.message || AUDIO_ERROR_MESSAGES[code] || 'Audio preparation failed.';
  return emptyAudio('unavailable', {
    source: 'spotmp3_job',
    sourceReference: result?.spotify_url ?? null,
    title: result?.title ?? null,
    artist: result?.artist ?? null,
    artists: result?.artists ?? [],
    album: result?.album ?? null,
    cover: result?.cover ?? null,
    error: message,
    errorCode: code,
    failureClass: code,
    note: error.details && Object.keys(error.details).length ? 'See error_code and job details.' : null
  });
}

function audioErrorMessage(track, job) {
  const raw = track?.error ?? job?.error ?? null;
  const failureClass = track?.failure_class ?? null;
  if (!raw && !failureClass) return null;
  if (failureClass && AUDIO_ERROR_MESSAGES[failureClass] && (!raw || raw === failureClass)) {
    return AUDIO_ERROR_MESSAGES[failureClass];
  }
  if (typeof raw === 'string' && AUDIO_ERROR_MESSAGES[raw]) return AUDIO_ERROR_MESSAGES[raw];
  return raw || AUDIO_ERROR_MESSAGES[failureClass] || null;
}

function applyJobTrackToResult(result, track, job, origin) {
  const completed = track.status === 'completed' && Boolean(track.download_url);
  const status = completed
    ? 'available'
    : track.status === 'failed'
      ? 'unavailable'
      : track.status === 'cancelled'
        ? 'cancelled'
        : track.status === 'running'
          ? 'processing'
          : track.status === 'queued'
            ? 'queued'
            : 'unavailable';

  const artists = Array.isArray(track.artists) && track.artists.length ? track.artists : result.artists;
  const artist = artists.length ? artists.join(', ') : result.artist;
  const cover = track.cover || result.cover;
  const durationMs = safeNumber(track.duration_ms) ?? result.duration_ms;
  const sizeBytes = safeNumber(track.size_bytes);

  result.title = track.title || result.title;
  result.artist = artist;
  result.artists = artists;
  result.album = track.album ?? result.album;
  result.cover = cover;
  result.thumbnail = cover;
  result.duration_ms = durationMs;
  result.duration = formatDuration(durationMs);

  result.audio = {
    status,
    available: completed,
    source: 'spotmp3_job',
    source_reference: result.spotify_url ?? job.source_url,
    job_source_url: job.source_url ?? null,
    file_id: track.id ?? result.spotify_id,
    file_url: completed ? toAbsoluteUrl(track.download_url, origin) : null,
    format: completed ? (job.format ?? 'mp3') : (job.format ?? null),
    bitrate: job.bitrate ?? null,
    bitrate_kbps: parseBitrateKbps(job.bitrate),
    size_bytes: sizeBytes,
    size_human: formatBytes(sizeBytes),
    filename: track.filename ?? null,
    title: track.title || result.title,
    artist,
    artists,
    album: track.album ?? result.album ?? null,
    cover,
    error: completed ? null : audioErrorMessage(track, job),
    error_code: track.failure_class ?? (job.error ? 'job_failed' : null),
    failure_class: track.failure_class ?? null,
    from_cache: Boolean(track.from_cache),
    job_id: job.job_id ?? null,
    job_status: job.status ?? null,
    expires_at: unixToIso(job.expires_at),
    lyrics_url: toAbsoluteUrl(track.lyrics_url, origin),
    note: completed
      ? 'MP3 is prepared on the SpotMP3 server. Download it before expires_at.'
      : 'No downloadable MP3 URL is available for this result.',
    sources: track.sources ?? null
  };
}

function markResultAudio(result, status, options = {}) {
  result.audio = emptyAudio(status, {
    sourceReference: result.spotify_url ?? null,
    ...options,
    title: result.title,
    artist: result.artist,
    artists: result.artists,
    album: result.album,
    cover: result.cover
  });
}

async function waitForJob(api, created, options) {
  const jobUrl = created.job_url || `/api/v1/jobs/${created.job_id}`;
  const startedAt = Date.now();
  let lastStatus = null;
  let lastProgress = null;

  while (true) {
    const elapsed = Date.now() - startedAt;
    if (elapsed > options.jobTimeout) {
      try {
        await api.cancelJob(jobUrl);
      } catch {}
      throw new ScrapeError(
        `Audio job ${created.job_id || '(unknown)'} did not finish within ${Math.round(options.jobTimeout / 1000)} seconds`,
        { code: 'job_timeout', details: { job_id: created.job_id ?? null, job_url: jobUrl } }
      );
    }

    let job;
    try {
      job = await api.getJob(jobUrl);
    } catch (error) {
      if (error.status === 404) {
        throw new ScrapeError(`Audio job ${created.job_id || '(unknown)'} was not found`, {
          code: 'job_not_found',
          status: 404,
          details: { job_url: jobUrl }
        });
      }
      if (error.code === 'network' || error.code === 'timeout' || RETRYABLE_STATUSES.has(error.status)) {
        if (options.verbose) {
          console.error(`[spotifyplay] Job poll failed (${error.message}); retrying...`);
        }
        await sleep(options.pollInterval);
        continue;
      }
      throw error;
    }

    if (job.status !== lastStatus) {
      console.error(`[spotifyplay] Job ${job.job_id || created.job_id}: ${job.status} (${job.completed ?? 0}/${job.total ?? 0})`);
      lastStatus = job.status;
    } else if (options.verbose && job.progress != null && job.progress !== lastProgress) {
      console.error(`[spotifyplay] Job ${job.job_id || created.job_id}: ${job.progress}%`);
    }
    lastProgress = job.progress;

    if (TERMINAL_JOB_STATUSES.has(job.status)) {
      return job;
    }

    await sleep(options.pollInterval);
  }
}

async function createJobWithRetry(api, trackUrls, title, warnings) {
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await api.createJob(trackUrls, title);
    } catch (error) {
      const retryable = error.status === 429
        || error.code === 'rate_limited'
        || error.code === 'one_at_a_time'
        || error.code === 'egress_paused';
      if (retryable && attempt < maxAttempts - 1) {
        const delay = error.retryAfter != null
          ? Math.min(error.retryAfter * 1000, 60000)
          : error.code === 'one_at_a_time'
            ? 5000
            : 2000 * (attempt + 1);
        warnings.push({
          stage: 'create_job',
          code: error.code,
          message: `${error.message}. Retrying in ${Math.round(delay / 1000)}s.`
        });
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new ScrapeError('Audio job could not be created after retries', { code: 'job_create_failed' });
}

function markRemainingAsQuota(results, startIndex, note) {
  for (let index = startIndex; index < results.length; index += 1) {
    if (results[index].audio?.available) continue;
    markResultAudio(results[index], 'quota_exhausted', {
      error: AUDIO_ERROR_MESSAGES.quota_exhausted,
      errorCode: 'daily_quota_exceeded',
      note
    });
  }
}

async function prepareAudio(options) {
  const { api, results, query, settings, warnings } = options;
  const summary = {
    enabled: settings.audioLimit !== 0,
    requested: 0,
    available: 0,
    unavailable: 0,
    not_requested: 0,
    from_cache: 0,
    batches: 0,
    quota_remaining: null,
    jobs: []
  };

  if (!results.length) return summary;

  if (settings.audioLimit === 0) {
    for (const result of results) {
      markResultAudio(result, 'disabled', {
        note: 'Audio preparation was disabled with --no-audio or --audio-limit 0.'
      });
    }
    summary.not_requested = 0;
    return summary;
  }

  let requested = settings.audioLimit === 'all'
    ? results.length
    : Math.min(settings.audioLimit, results.length);
  const uncappedRequested = requested;
  requested = Math.min(requested, MAX_AUDIO_TRACKS);
  summary.requested = requested;

  if (uncappedRequested > requested) {
    warnings.push({
      stage: 'audio',
      code: 'audio_capped',
      message: `Audio preparation was capped at ${MAX_AUDIO_TRACKS} tracks per run.`
    });
  }

  if (requested < results.length) {
    for (let index = requested; index < results.length; index += 1) {
      markResultAudio(results[index], 'not_requested', {
        note: `Audio was requested for the first ${requested} result(s). Use --audio-limit all to prepare every result.`
      });
      summary.not_requested += 1;
    }
  }

  const targets = results.slice(0, requested);
  for (let offset = 0; offset < targets.length; offset += settings.batchSize) {
    const batch = targets.slice(offset, offset + settings.batchSize);
    const firstNumber = offset + 1;
    const lastNumber = offset + batch.length;
    console.error(`[spotifyplay] Preparing audio ${firstNumber}-${lastNumber} of ${requested}...`);

    let created;
    try {
      created = await createJobWithRetry(
        api,
        batch.map((result) => result.spotify_url),
        query,
        warnings
      );
    } catch (error) {
      summary.batches += 1;
      if (
        error.code === 'daily_quota_exceeded'
        || error.code === 'daily_quota_reached'
        || (error.status === 429 && /quota/i.test(error.message))
      ) {
        markRemainingAsQuota(results, offset, 'Free audio allowance is exhausted or rate limited.');
        summary.quota_remaining = 0;
        warnings.push({
          stage: 'create_job',
          code: error.code,
          message: error.message
        });
        break;
      }
      if (error.code === 'supporter_required') {
        for (let index = offset; index < results.length; index += 1) {
          markResultAudio(results[index], 'unavailable', {
            error: error.message,
            errorCode: error.code,
            note: 'The free batch path rejected this selection.'
          });
        }
        warnings.push({
          stage: 'create_job',
          code: error.code,
          message: error.message
        });
        break;
      }
      for (const result of batch) {
        result.audio = audioFailureFromError(error, result);
      }
      warnings.push({
        stage: 'create_job',
        code: error.code,
        message: error.message
      });
      if (error.code === 'network' || error.code === 'timeout') break;
      continue;
    }

    summary.batches += 1;
    if (created.quota_limited) {
      warnings.push({
        stage: 'create_job',
        code: 'quota_limited',
        message: `The server limited this job to ${created.total ?? 'fewer'} track(s).`
      });
    }
    if (safeNumber(created.quota_remaining) != null) {
      summary.quota_remaining = safeNumber(created.quota_remaining);
    }

    let job;
    try {
      job = await waitForJob(api, created, settings);
    } catch (error) {
      for (const result of batch) {
        result.audio = audioFailureFromError(error, result);
      }
      warnings.push({
        stage: 'job',
        code: error.code,
        message: error.message,
        details: error.details
      });
      if (error.code === 'network' || error.code === 'timeout') break;
      continue;
    }

    if (safeNumber(job.quota_remaining) != null) {
      summary.quota_remaining = safeNumber(job.quota_remaining);
    }

    const returnedTracks = new Map(
      (job.tracks ?? [])
        .filter((track) => track && track.id)
        .map((track) => [track.id, track])
    );

    for (const result of batch) {
      const track = returnedTracks.get(result.spotify_id);
      if (!track) {
        markResultAudio(result, 'quota_exhausted', {
          error: AUDIO_ERROR_MESSAGES.quota_dropped,
          errorCode: 'quota_dropped',
          failureClass: 'quota_dropped',
          note: 'The job response did not include this track.'
        });
        continue;
      }
      applyJobTrackToResult(result, track, job, api.origin);
    }

    summary.jobs.push({
      job_id: job.job_id ?? created.job_id ?? null,
      status: job.status ?? null,
      total: safeNumber(job.total),
      completed: safeNumber(job.completed),
      failed: safeNumber(job.failed),
      dropped_tracks: safeNumber(job.dropped_tracks),
      bundle_url: toAbsoluteUrl(job.download_url, api.origin),
      expires_at: unixToIso(job.expires_at),
      quota_remaining: summary.quota_remaining
    });

    if (job.status === 'failed' || job.status === 'partial' || job.status === 'cancelled') {
      warnings.push({
        stage: 'job',
        code: `job_${job.status}`,
        message: `Audio job ${job.job_id ?? created.job_id} finished with status ${job.status} (${job.completed ?? 0} completed, ${job.failed ?? 0} failed).`
      });
    }

    if (job.dropped_tracks > 0) {
      const nextIndex = offset + batch.length;
      markRemainingAsQuota(results, nextIndex, 'The server dropped tracks from this job, usually because of the free daily allowance.');
      warnings.push({
        stage: 'job',
        code: 'list_truncated',
        message: `${job.dropped_tracks} track(s) were dropped from the job by the server.`
      });
      break;
    }

    if (summary.quota_remaining === 0 && offset + batch.length < targets.length) {
      markRemainingAsQuota(
        results,
        offset + batch.length,
        'The free daily audio allowance is exhausted; retry after midnight UTC.'
      );
      warnings.push({
        stage: 'job',
        code: 'daily_quota_reached',
        message: 'The server reported no remaining daily audio quota.'
      });
      break;
    }
  }

  summary.available = results.filter((result) => result.audio.available).length;
  summary.unavailable = results.filter((result) => result.audio.status === 'unavailable').length;
  summary.from_cache = results.filter((result) => result.audio.from_cache).length;
  summary.not_requested = results.filter((result) => result.audio.status === 'not_requested').length;

  return summary;
}

function parseInteger(value, name, options = {}) {
  const number = Number(value);
  if (!Number.isInteger(number)) {
    throw new ScrapeError(`--${name} must be an integer`, { code: 'invalid_argument' });
  }
  if (options.min != null && number < options.min) {
    throw new ScrapeError(`--${name} must be at least ${options.min}`, { code: 'invalid_argument' });
  }
  if (options.max != null && number > options.max) {
    throw new ScrapeError(`--${name} must be at most ${options.max}`, { code: 'invalid_argument' });
  }
  return number;
}

function parseArgs(argv) {
  const options = {
    query: '',
    limit: 10,
    offset: 0,
    pages: 1,
    audioLimit: 'all',
    batchSize: MAX_BATCH_SIZE,
    timeout: 20000,
    jobTimeout: 360000,
    pollInterval: 5000,
    out: 'spotifyplay-result.json',
    save: true,
    human: true,
    compact: false,
    verbose: false,
    help: false,
    version: false,
    apiBase: process.env.SPOTMP3_API_BASE || API_BASE,
    runtimeNotes: []
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--') {
      positional.push(...argv.slice(index + 1));
      break;
    }
    if (argument === '-h' || argument === '--help') {
      options.help = true;
      continue;
    }
    if (argument === '-V' || argument === '--version') {
      options.version = true;
      continue;
    }
    if (!argument.startsWith('-')) {
      positional.push(argument);
      continue;
    }

    const equalIndex = argument.indexOf('=');
    const name = argument.slice(2, equalIndex >= 0 ? equalIndex : undefined);
    const inlineValue = equalIndex >= 0 ? argument.slice(equalIndex + 1) : null;

    const takeValue = () => {
      if (inlineValue != null) return inlineValue;
      index += 1;
      if (index >= argv.length) {
        throw new ScrapeError(`Missing value for --${name}`, { code: 'invalid_argument' });
      }
      return argv[index];
    };

    switch (name) {
      case 'limit':
        options.limit = parseInteger(takeValue(), 'limit', { min: 1, max: MAX_SEARCH_LIMIT });
        break;
      case 'offset':
        options.offset = parseInteger(takeValue(), 'offset', { min: 0 });
        break;
      case 'pages':
        options.pages = parseInteger(takeValue(), 'pages', { min: 1, max: MAX_SEARCH_PAGES });
        break;
      case 'audio-limit': {
        const value = takeValue();
        if (value === 'all') {
          options.audioLimit = 'all';
        } else {
          options.audioLimit = parseInteger(value, 'audio-limit', { min: 0, max: MAX_AUDIO_TRACKS });
        }
        break;
      }
      case 'batch-size': {
        const requested = parseInteger(takeValue(), 'batch-size', { min: 1, max: 100 });
        options.batchSize = Math.min(requested, MAX_BATCH_SIZE);
        if (requested > MAX_BATCH_SIZE) {
          options.runtimeNotes.push(`--batch-size ${requested} was reduced to ${MAX_BATCH_SIZE} to match the free tier.`);
        }
        break;
      }
      case 'timeout':
        options.timeout = parseInteger(takeValue(), 'timeout', { min: 1000 });
        break;
      case 'job-timeout':
        options.jobTimeout = parseInteger(takeValue(), 'job-timeout', { min: 5000 });
        break;
      case 'poll-interval':
        options.pollInterval = parseInteger(takeValue(), 'poll-interval', { min: 1000 });
        break;
      case 'out':
        options.out = takeValue();
        break;
      case 'api-base':
        options.apiBase = takeValue();
        break;
      case 'no-audio':
        options.audioLimit = 0;
        break;
      case 'no-save':
        options.save = false;
        break;
      case 'quiet':
      case 'no-human':
        options.human = false;
        break;
      case 'compact':
        options.compact = true;
        break;
      case 'verbose':
        options.verbose = true;
        break;
      default:
        throw new ScrapeError(`Unknown option --${name}`, { code: 'invalid_argument' });
    }
  }

  options.query = positional.join(' ').replace(/\s+/g, ' ').trim();
  if (options.help || options.version) return options;
  if (!options.query) {
    throw new ScrapeError('Search query is required', { code: 'missing_query' });
  }
  if (options.query.length > 300) {
    throw new ScrapeError('Search query is too long (maximum 300 characters)', { code: 'invalid_argument' });
  }
  try {
    const parsed = new URL(options.apiBase);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('unsupported protocol');
    options.apiBase = parsed.toString().replace(/\/+$/, '');
  } catch {
    throw new ScrapeError('--api-base must be a valid HTTP(S) URL', { code: 'invalid_argument' });
  }

  return options;
}

function printUsage() {
  const text = [
    'SpotMP3 Spotify Play scraper',
    '',
    'Usage:',
    '  node scrape-spotifyplay.js <query/search music> [options]',
    '',
    'Options:',
    '  --limit N            Track results per search page (1-50, default 10)',
    '  --offset N           Search offset (default 0)',
    '  --pages N            Search pages to merge (1-10, default 1)',
    '  --audio-limit N      Prepare MP3 for the first N tracks (0-30)',
    '  --audio-limit all    Prepare MP3 for every track result (default)',
    '  --batch-size N       Tracks per audio job (1-3, default 3)',
    '  --timeout MS         HTTP timeout in ms (default 20000)',
    '  --job-timeout MS     Audio job timeout in ms (default 360000)',
    '  --poll-interval MS   Job poll interval in ms (default 5000)',
    '  --out FILE           JSON output path (default spotifyplay-result.json)',
    '  --no-audio           Search metadata only, do not prepare MP3',
    '  --no-save            Do not write the JSON file',
    '  --quiet              Suppress the human-readable preview on stderr',
    '  --compact            Emit compact JSON instead of pretty JSON',
    '  --verbose            Verbose job polling logs',
    '  --api-base URL       Override the SpotMP3 API base',
    '  -h, --help           Show this help',
    '  -V, --version        Show the scraper version',
    '',
    'Examples:',
    '  node scrape-spotifyplay.js "shape of you"',
    '  node scrape-spotifyplay.js "coldplay yellow" --limit 5 --audio-limit 3',
    '  node scrape-spotifyplay.js "lofi" --no-audio --out lofi.json',
    '',
    'Audio preparation uses the free SpotMP3 allowance (30 tracks per IP per day,',
    'reset at midnight UTC). Each prepared track consumes one track of that allowance.'
  ].join('\n');
  console.error(text);
}

function printHuman(output, outFile) {
  const line = '='.repeat(78);
  const audio = output.audio_preparation;
  console.error(line);
  console.error(`SpotMP3 Search : ${output.query.search_keyword}`);
  console.error(`Status         : ${output.status}`);
  console.error(`Hasil tracks   : ${output.summary.total_results} (total match: ${output.query.total_track_matches ?? '?'})`);
  console.error(`Audio siap     : ${audio.available}/${audio.requested}${audio.quota_remaining != null ? ` | sisa kuota: ${audio.quota_remaining}` : ''}`);
  if (outFile) console.error(`File JSON      : ${outFile}`);
  console.error(line);

  if (!output.results.length) {
    console.error('Tidak ada hasil lagu untuk query ini.');
  }

  for (const result of output.results) {
    console.error('');
    console.error(`[${result.index}] Thumbnail/Sampul : ${result.thumbnail ?? '-'}`);
    console.error(`    Query/Judul      : ${output.query.search_keyword} / ${result.title ?? '-'}`);
    console.error(`    Artist/Artis     : ${result.artist ?? '-'}`);
    console.error(`    Album            : ${result.album ?? '-'}`);
    console.error(`    Duration/Durasi  : ${result.duration ?? '-'}${result.duration_ms != null ? ` (${result.duration_ms} ms)` : ''}`);
    const mp3Display = result.audio.file_url
      ?? (result.audio.error ? `- (${result.audio.status}: ${result.audio.error})` : `- (${result.audio.status})`);
    console.error(`    Url mp3          : ${mp3Display}`);
    console.error(`    Spotify          : ${result.spotify_url ?? '-'}`);
    console.error(`    Versi/Kecocokan  : ${result.version.join(', ')} | skor ${result.match.score} (${result.match.confidence})`);
    console.error(`    Audio            : ${result.audio.status}${result.audio.format ? ` | ${result.audio.format}` : ''}${result.audio.bitrate ? ` ${result.audio.bitrate}` : ''}${result.audio.size_human ? ` | ${result.audio.size_human}` : ''}`);
    if (result.audio.error) {
      console.error(`    Error audio      : ${result.audio.error}`);
    }
    if (result.audio.expires_at) {
      console.error(`    URL berlaku sampai: ${result.audio.expires_at}`);
    }
  }

  if (output.warnings.length) {
    console.error('');
    console.error(`Warnings (${output.warnings.length}):`);
    for (const warning of output.warnings) {
      console.error(`  - [${warning.code || warning.stage}] ${warning.message}`);
    }
  }

  if (output.errors.length) {
    console.error('');
    console.error(`Errors (${output.errors.length}):`);
    for (const error of output.errors) {
      console.error(`  - [${error.code}] ${error.message}`);
    }
  }
  console.error('');
}

function buildSummary(results, search, audioSummary) {
  return {
    total_results: results.length,
    found: results.filter((result) => result.status === 'found').length,
    audio_available: results.filter((result) => result.audio.available).length,
    audio_unavailable: results.filter((result) => result.audio.status === 'unavailable').length,
    audio_not_prepared: results.filter((result) => result.audio.status === 'not_requested').length,
    audio_disabled: results.filter((result) => result.audio.status === 'disabled').length,
    audio_quota_exhausted: results.filter((result) => result.audio.status === 'quota_exhausted').length,
    pages_fetched: search?.pagesFetched ?? 0,
    track_match_total: search?.trackTotal ?? null,
    audio_requested: audioSummary.requested,
    audio_batches: audioSummary.batches,
    audio_from_cache: audioSummary.from_cache,
    quota_remaining: audioSummary.quota_remaining
  };
}

function errorToObject(error) {
  return {
    code: error.code || 'scraper_error',
    message: error.message || 'Unknown error',
    status: error.status || 0,
    details: error.details || {},
    retry_after: error.retryAfter ?? null
  };
}

async function writeJsonFile(filePath, data) {
  const resolved = path.resolve(filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return resolved;
}

async function main() {
  let settings;
  try {
    settings = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[spotifyplay] ${error.message}`);
    printUsage();
    process.exitCode = 2;
    return;
  }

  if (settings.help) {
    printUsage();
    return;
  }
  if (settings.version) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  const warnings = [];
  for (const note of settings.runtimeNotes) {
    warnings.push({ stage: 'arguments', code: 'argument_adjusted', message: note });
  }
  const apiBase = settings.apiBase;
  const origin = new URL(apiBase).origin;
  const api = new SpotMP3Api({
    origin,
    apiBase,
    timeout: settings.timeout,
    retries: 2
  });
  const startedAt = Date.now();
  let search = null;
  let results = [];
  let audioSummary = {
    enabled: settings.audioLimit !== 0,
    requested: 0,
    available: 0,
    unavailable: 0,
    not_requested: 0,
    from_cache: 0,
    batches: 0,
    quota_remaining: null,
    jobs: []
  };
  let fatalError = null;

  console.error(`[spotifyplay] Searching "${settings.query}"...`);
  try {
    search = await collectSearchResults(api, settings.query, {
      limit: settings.limit,
      offset: settings.offset,
      pages: settings.pages,
      retries: 2
    });
    warnings.push(...search.warnings);

    results = search.tracks.map((item, index) => normalizeSearchTrack(item, settings.query, index + 1));

    if (!results.length) {
      warnings.push({
        stage: 'search',
        code: 'not_found',
        message: 'No track results were returned by the SpotMP3 search API.'
      });
    } else {
      audioSummary = await prepareAudio({
        api,
        results,
        query: settings.query,
        settings,
        warnings
      });
    }
  } catch (error) {
    fatalError = errorToObject(error);
    console.error(`[spotifyplay] Fatal: ${error.message}`);
  }

  const output = {
    scraper: {
      name: 'spotifyplay-spotmp3',
      version: VERSION,
      target_url: SITE_ORIGIN,
      api_base: apiBase,
      method: 'internal JSON API',
      javascript_required: true,
      cheerio_used: false,
      note: 'SpotMP3 is a React single-page app. Search data is served by its internal /api/v1 JSON endpoints, so Axios is sufficient and Cheerio cannot read results from the HTML shell.'
    },
    generated_at: nowIso(),
    duration_ms: Date.now() - startedAt,
    query: {
      search_keyword: settings.query,
      limit: settings.limit,
      offset: settings.offset,
      pages_requested: settings.pages,
      pages_fetched: search?.pagesFetched ?? 0,
      total_track_matches: search?.trackTotal ?? null,
      sections: search?.sections ?? {}
    },
    status: fatalError ? 'unavailable' : results.length ? 'found' : 'not_found',
    summary: buildSummary(results, search, audioSummary),
    audio_preparation: audioSummary,
    results,
    warnings,
    errors: fatalError ? [fatalError] : []
  };

  let savedPath = null;
  if (settings.save) {
    try {
      savedPath = await writeJsonFile(settings.out, output);
    } catch (error) {
      warnings.push({
        stage: 'output',
        code: 'write_failed',
        message: `Could not write JSON file: ${error.message}`
      });
    }
  }

  if (settings.human) {
    printHuman(output, savedPath);
  }

  const serialized = settings.compact
    ? JSON.stringify(output)
    : JSON.stringify(output, null, 2);
  process.stdout.write(`${serialized}\n`);

  if (fatalError) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[spotifyplay] Unhandled error: ${error.stack || error.message}`);
  process.exitCode = 1;
});