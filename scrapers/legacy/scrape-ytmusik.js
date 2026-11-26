#!/usr/bin/env node

/**
 * Name : Youtubr Music
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web : https://music.youtube.com/
 * Type : Scraper
 * Description : Streaming musik
Note : Udah lengkap semua intinya, btw error fix sendiri
 */

const axios = require('axios');
const cheerio = require('cheerio');

const USAGE = {
  usage: [
    'node scrape-ytmusik.js "<query>"            scrape hasil pencarian (all)',
    'node scrape-ytmusik.js "<query>" --filter songs   filter: songs|videos|artists|albums|community|featured|podcasts|episodes',
    'node scrape-ytmusik.js "<query>" --pages 3        jumlah halaman continuation (mode filter)',
    'node scrape-ytmusik.js "<query>" --stream 5       berapa item lagu/video yang di-probe streaming',
    'node scrape-ytmusik.js "<query>" --deep 2         enrich detail artis (popular songs, albums, related)',
    'node scrape-ytmusik.js --full                     scrape Home, Categories, Moods & Genres, Charts',
  ].join('\n'),
  env: {
    YTM_GL: 'region (default ID)', YTM_HL: 'language (default en)',
    YTM_RETRIES: 'max retry per request (default 12, infinite = selalu ulang)',
    YTM_TIMEOUT: 'timeout per request ms (default 30000)',
    YTM_STREAM_LIMIT: 'stream probe limit (atau --stream N)',
    YTM_CHART_ITEMS: 'item per chart (default 25, atau --chart-items N)',
    YTM_MOODS_DEEP: 'mood yang di-browse detail (default 6, atau --moods-deep N)',
    YTM_CATEGORY_ITEMS: 'item per kategori (default 12)',
  }
};

const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--full') flags.full = true;
  else if (a === '--filter') flags.filter = (argv[++i] || '').toLowerCase();
  else if (a === '--pages') flags.pages = parseInt(argv[++i], 10) || 1;
  else if (a === '--stream') flags.stream = parseInt(argv[++i], 10);
  else if (a === '--deep') flags.deep = parseInt(argv[++i], 10);
  else if (a === '--chart-items') flags.chartItems = parseInt(argv[++i], 10);
  else if (a === '--moods-deep') flags.moodsDeep = parseInt(argv[++i], 10);
  else if (a === '--category-items') flags.categoryItems = parseInt(argv[++i], 10);
  else if (a === '--gl') flags.gl = argv[++i];
  else if (a === '--hl') flags.hl = argv[++i];
  else if (a === '--help' || a === '-h') flags.help = true;
  else positional.push(a);
}

if (flags.help) {
  process.stdout.write(JSON.stringify({ status: false, help: USAGE }, null, 2) + '\n');
  process.exitCode = 0; return;
}

const GL = (flags.gl || process.env.YTM_GL || 'ID').toUpperCase();
const HL = (flags.hl || process.env.YTM_HL || 'en');
const TIMEOUT = intEnv('YTM_TIMEOUT', 30000);
let MAX_ATTEMPTS = intEnv('YTM_RETRIES', 12);
if (process.env.YTM_RETRIES === 'infinite') MAX_ATTEMPTS = Infinity;
const STREAM_LIMIT = flags.stream != null ? flags.stream : intEnv('YTM_STREAM_LIMIT', 5);
const DEEP_LIMIT = flags.deep != null ? flags.deep : 0;
const PAGES = flags.pages || 1;
const CHART_ITEMS = flags.chartItems != null ? flags.chartItems : intEnv('YTM_CHART_ITEMS', 25);
const MOODS_DEEP = flags.moodsDeep != null ? flags.moodsDeep : intEnv('YTM_MOODS_DEEP', 6);
const CATEGORY_ITEMS = flags.categoryItems != null ? flags.categoryItems : intEnv('YTM_CATEGORY_ITEMS', 12);
const SEARCH_TYPE = flags.filter || 'all';

function intEnv(name, def) {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) ? v : def;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const UA_DESKTOP = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const UA_IOS = 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)';
const MUSIC_API = 'https://music.youtube.com/youtubei/v1/';
const YT_API = 'https://www.youtube.com/youtubei/v1/';
const FALLBACK_CLIENT_VERSION = '1.20261027.10.00';

const state = {
  clientVersion: FALLBACK_CLIENT_VERSION,
  sessionReady: false
};

async function withRetry(fn, { attempts = MAX_ATTEMPTS, label = 'request' } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const status = e && e.response && e.response.status;
      const retriable = !status || status >= 500 || status === 403 || status === 429 || status === 400;
      if (i < attempts - 1 && retriable) {
        const base = Math.min(20000, 1200 * Math.pow(2, i));
        const delay = base * (0.75 + Math.random() * 0.5);
        process.stderr.write(`[retry ${i + 1}] ${label}: ${e.message} -> ${Math.round(delay)}ms\n`);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

async function ensureSession() {
  if (state.sessionReady) return;
  try {
    const res = await withRetry(() => axios.get('https://music.youtube.com/', {
      headers: { 'User-Agent': UA_DESKTOP, 'Accept-Language': `${HL},en;q=0.9` },
      timeout: TIMEOUT,
      responseType: 'text'
    }), { label: 'init-session' });
    const html = String(res.data);
    const $ = cheerio.load(html);
    const matched = $('script').contents().text().match(/INNERTUBE_CLIENT_VERSION\\?"\s*:\s*\\?"([\d.]+)/);
    const ver = matched ? matched[1] : null;
    if (ver) state.clientVersion = ver;
  } catch (e) {
    process.stderr.write(`[warn] init-session gagal: ${e.message} (pakai versi default)\n`);
  }
  state.sessionReady = true;
}

function webRemixContext() {
  return { context: { client: { hl: HL, gl: GL, clientName: 'WEB_REMIX', clientVersion: state.clientVersion } } };
}

async function callMusic(endpoint, payload, { base = MUSIC_API, headers = {}, label, attempts } = {}) {
  const url = `${base}${endpoint}?prettyPrint=false`;
  const finalHeaders = Object.assign({
    'Content-Type': 'application/json',
    'User-Agent': UA_DESKTOP,
    'Origin': 'https://music.youtube.com',
    'X-Youtube-Client-Name': '67',
    'X-Youtube-Client-Version': state.clientVersion,
    'Accept-Language': `${HL},en;q=0.9`
  }, headers);
  return withRetry(() => axios.post(url, payload, {
    headers: finalHeaders,
    timeout: TIMEOUT,
    responseType: 'json'
  }), { label: label || endpoint, attempts: attempts == null ? MAX_ATTEMPTS : attempts });
}

async function browse(browseId, params, opts = {}) {
  const body = Object.assign(webRemixContext(), { browseId });
  if (params) body.params = params;
  if (opts.continuation) body.continuation = opts.continuation;
  const res = await callMusic('browse', body, opts);
  return res.data;
}

async function search(query, params, opts = {}) {
  const body = Object.assign(webRemixContext(), { query });
  if (params) body.params = params;
  if (opts.continuation) body.continuation = opts.continuation;
  const res = await callMusic('search', body, opts);
  return res.data;
}

const PLAYER_CLIENTS = [
  {
    id: 'IOS',
    base: YT_API,
    headers: { 'User-Agent': UA_IOS, 'X-Ios-Bundle-Identifier': 'com.google.ios.youtube' },
    context: () => ({ context: { client: { clientName: 'IOS', clientVersion: '20.10.4', deviceModel: 'iPhone16,2', osName: 'iPhone', osVersion: '18.3.2.21E236', hl: HL, gl: GL, utcOffsetMinutes: 420, timeZone: 'Asia/Jakarta' } } })
  },
  {
    id: 'WEB_REMIX',
    base: MUSIC_API,
    headers: { 'User-Agent': UA_DESKTOP, 'X-Youtube-Client-Name': '67', 'X-Youtube-Client-Version': state.clientVersion },
    context: () => webRemixContext()
  },
  {
    id: 'ANDROID_VR',
    base: YT_API,
    headers: { 'User-Agent': 'com.google.android.apps.youtube.vr.oculus/1.61.48 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip' },
    context: () => ({ context: { client: { clientName: 'ANDROID_VR', clientVersion: '1.61.48', deviceMake: 'Oculus', deviceModel: 'Quest 3', osName: 'Android', osVersion: '12L', androidSdkVersion: 32, hl: HL, gl: GL } } })
  }
];

async function probePlayer(videoId, { attempts = 2 } = {}) {
  for (const client of PLAYER_CLIENTS) {
    try {
      if (client.id === 'WEB_REMIX') await ensureSession();
      const body = Object.assign(client.context(), { videoId, contentCheckOk: true, racyCheckOk: true });
      const res = await withRetry(() => axios.post(`${client.base}player?prettyPrint=false`, body, {
        headers: Object.assign({ 'Content-Type': 'application/json', 'Accept-Language': `${HL},en;q=0.9` }, client.headers),
        timeout: Math.min(TIMEOUT, 20000),
        responseType: 'json'
      }), { label: `player-${client.id}`, attempts });
      const data = res.data;
      const status = data.playabilityStatus && data.playabilityStatus.status;
      const sd = data.streamingData || {};
      const formats = [].concat(sd.formats || [], sd.adaptiveFormats || []);
      const playable = status === 'OK' && formats.length > 0;
      if (playable || attempts === 1) {
        return { client: client.id, data, status, formats, expiresInSeconds: sd.expiresInSeconds || null };
      }
      if (status !== 'OK') continue;
      return { client: client.id, data, status, formats, expiresInSeconds: sd.expiresInSeconds || null };
    } catch (e) {
      continue;
    }
  }
  return null;
}

function thumbBest(node) {
  let found = null;
  (function w(o) {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(w); return; }
    if (Array.isArray(o.thumbnails) && o.thumbnails.length) {
      const t = o.thumbnails[o.thumbnails.length - 1];
      if (t && t.url && !found) found = t.url;
    }
    for (const k in o) {
      const v = o[k];
      if (v && typeof v === 'object') w(v);
    }
  })(node);
  if (!found) return null;
  return found.replace(/=w\d+-h\d+[^/]*$/, '=w544-h544-l90-rj');
}

function parseHMS(text) {
  if (!text || typeof text !== 'string') return null;
  const m = text.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  return h * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
}

function parseCount(text) {
  if (!text) return null;
  let raw = typeof text === 'string' ? text : (text.runs || []).map((r) => r.text).join('');
  raw = raw.replace(/,(?=\d{3}\b)/g, '').trim();
  const m = raw.match(/^([\d.]+)\s*(K|M|B|JT|RB|RB|T)?/i);
  if (!m) return null;
  let val = parseFloat(m[1].replace(/,(?=\d)/, '.'));
  if (!Number.isFinite(val)) return null;
  const suffix = (m[2] || '').toLowerCase();
  if (suffix === 'k' || suffix === 'rb') val *= 1e3;
  else if (suffix === 'm') val *= 1e6;
  else if (suffix === 'b') val *= 1e9;
  else if (suffix === 'jt') val *= 1e6;
  else if (suffix === 't') val *= 1e12;
  return Math.round(val);
}

function runsOf(col) {
  if (!col) return [];
  const text = col.musicResponsiveListItemFlexColumnRenderer && col.musicResponsiveListItemFlexColumnRenderer.text;
  return (text && text.runs) || [];
}

function runsData(col) {
  return runsOf(col).map((r) => ({
    text: r.text || '',
    nav: r.navigationEndpoint || null,
    browseId: r.navigationEndpoint && r.navigationEndpoint.browseEndpoint && r.navigationEndpoint.browseEndpoint.browseId || null,
    params: r.navigationEndpoint && r.navigationEndpoint.browseEndpoint && r.navigationEndpoint.browseEndpoint.params || null,
    videoId: r.navigationEndpoint && r.navigationEndpoint.watchEndpoint && r.navigationEndpoint.watchEndpoint.videoId || null
  }));
}

function colText(col) {
  return runsOf(col).map((r) => r.text || '').join('').trim();
}

function rowEndpoints(it) {
  const nav = watchFromNav(it.navigationEndpoint);
  if (nav) return nav;
  const cols = it.flexColumns || [];
  for (const col of cols) {
    for (const r of runsData(col)) {
      if (r.videoId) return { videoId: r.videoId };
      if (r.browseId) return { browseId: r.browseId, params: r.params };
    }
  }
  const overlay = it.overlay && it.overlay.musicItemThumbnailOverlayRenderer;
  const playNav = overlay && overlay.content && overlay.content.musicPlayButtonRenderer && overlay.content.musicPlayButtonRenderer.playNavigationEndpoint;
  const nav2 = watchFromNav(playNav);
  if (nav2) return nav2;
  return {};
}

function watchFromNav(nav) {
  if (!nav) return null;
  const be = nav.browseEndpoint;
  if (be && be.browseId) return { browseId: be.browseId, params: be.params };
  const we = nav.watchEndpoint;
  if (we && we.videoId) return { videoId: we.videoId, playlistId: we.playlistId || null };
  return null;
}

function rowExplicit(it) {
  return String(JSON.stringify((it.flexColumns || []).concat(it.badges || []))).indexOf('MUSIC_EXPLICIT_BADGE') !== -1;
}

function cleanId(id) {
  if (!id) return null;
  if (/^VL/.test(id)) return id.slice(2);
  return id;
}

const TYPE_LABELS = {
  song: ['song', 'songs'],
  video: ['video', 'videos', 'official music video'],
  artist: ['artist', 'artists'],
  album: ['album', 'albums', 'ep', 'single'],
  playlist: ['playlist', 'playlists', 'community playlists', 'featured playlists', 'podcast', 'podcasts']
};
const KNOWN_LABELS = [].concat(TYPE_LABELS.song, TYPE_LABELS.video, TYPE_LABELS.artist, TYPE_LABELS.album, TYPE_LABELS.playlist).map((s) => s.toUpperCase());

function classifyRow(it, shelfType) {
  const col0 = (it.flexColumns || [])[0];
  const runs = runsData(col0);
  const col1run = runsOf((it.flexColumns || [])[1]);
  let label = shelfType || '';
  if (col1run.length) {
    const first = (col1run[0].text || '').trim();
    if (KNOWN_LABELS.indexOf(first.toUpperCase()) !== -1) label = first;
  }
  const nav = (runs.map((r) => (r.nav ? watchFromNav(r.nav) : null)).find(Boolean)) || rowEndpoints(it);
  return { label, nav };
}

function parseRowByType(it, cls) {
  const col0 = (it.flexColumns || [])[0];
  const col1 = (it.flexColumns || [])[1];
  const col2txt = colText((it.flexColumns || [])[2]);
  const titleRuns = runsData(col0);
  const title = titleRuns.map((r) => r.text).join('').trim() || null;
  const titleNav = titleRuns.map((r) => (r.nav ? watchFromNav(r.nav) : null)).find(Boolean) || {};
  const explicit = rowExplicit(it);
  const data = runsData(col1);
  const artistRun = data.find((r) => r.browseId && /^UC/.test(r.browseId));
  const albumRun = data.find((r) => r.browseId && /^(MPREb|MPSP)/.test(r.browseId));
  const playlistRun = data.find((r) => r.browseId && /^(VL|PL|OLA|MPSP)/.test(r.browseId));
  const plainInfo = data.filter((r) => !r.nav);
  const infoText = plainInfo.map((r) => r.text).join(' ');
  const duration = (plainInfo.map((r) => r.text).reverse().find((t) => parseHMS(t) != null));
  const label = (cls.label || '').toLowerCase();
  const isArtist = /artist/.test(label);
  const isAlbum = /(^album|\bep\b|\bsingle)/.test(label);
  const isPlaylist = /playlist|podcast/.test(label);
  const isVideo = /video/.test(label);

  if (isArtist) {
    const aud = infoText.match(/([\d.]+[,.]?\d*[KMB]?)\s*(subscribers?|monthly audience)/i);
    return {
      artist_id: titleNav.browseId || (cls.nav && cls.nav.browseId) || null,
      name: title,
      description: null,
      thumbnail_url: thumbBest(it.thumbnail),
      subscriber_count: aud && /subscribers/i.test(aud[0]) ? parseCount(aud[1]) : null,
      monthly_audience: aud && /audience/i.test(aud[0]) ? parseCount(aud[1]) : null,
      popular_songs: null,
      albums: null,
      singles: null,
      related_artists: null,
      artist_url: titleNav.browseId ? `https://music.youtube.com/channel/${titleNav.browseId}` : ((cls.nav && cls.nav.browseId) ? `https://music.youtube.com/channel/${cls.nav.browseId}` : null)
    };
  }
  if (isAlbum) {
    const dateRun = data.filter((r) => !r.nav && /^\d{4}(\s|$)/.test(r.text))[0];
    return {
      album_id: titleNav.browseId || (cls.nav && cls.nav.browseId) || null,
      title,
      artist: artistRun ? artistRun.text : null,
      artist_id: artistRun ? artistRun.browseId : null,
      release_date: dateRun ? dateRun.text.trim() : null,
      total_tracks: null,
      thumbnail_url: thumbBest(it.thumbnail),
      album_type: /ep/.test(label) ? 'EP' : /single/.test(label) ? 'single' : 'album',
      track_list: null
    };
  }
  if (isPlaylist) {
    const tracksMatch = infoText.match(/(\d+[,.]?\d*[KMB]?)\s*(songs|tracks)/i);
    const pId = cleanId(titleNav.browseId || (cls.nav && cls.nav.browseId) || null);
    return {
      playlist_id: pId,
      title,
      description: null,
      creator: artistRun ? artistRun.text : (data.filter((r) => !r.nav && r.text).map((r) => r.text.trim()).filter(Boolean).slice(-1)[0] || null),
      total_tracks: tracksMatch ? parseCount(tracksMatch[1]) : null,
      thumbnail_url: thumbBest(it.thumbnail),
      playlist_type: /podcast/.test(label) ? 'podcast' : cleanType(cls.shelfType) || 'playlist',
      track_list: null,
      playlist_url: pId ? playlistUrl(pId) : null
    };
  }
  if (isVideo) {
    const viewsMatch = (col2txt + ' ' + infoText).match(/([\d.,]+)\s*[KMB]?\s*views?/i);
    const viewsRaw = viewsMatch ? viewsMatch[0].trim() : null;
    return {
      video_id: titleNav.videoId || (cls.nav && cls.nav.videoId) || null,
      title,
      artist: artistRun ? artistRun.text : null,
      channel_name: artistRun ? artistRun.text : null,
      duration: duration ? duration.trim() : null,
      duration_seconds: duration ? parseHMS(duration) : null,
      upload_date: null,
      view_count: viewsRaw ? parseCount(viewsRaw) : null,
      thumbnail_url: thumbBest(it.thumbnail),
      video_url: (titleNav.videoId || (cls.nav && cls.nav.videoId)) ? `https://music.youtube.com/watch?v=${titleNav.videoId || cls.nav.videoId}` : null,
      content_type: 'music_video',
      streaming: nullStream(),
      playback: nullPlayback()
    };
  }
  return {
    video_id: titleNav.videoId || (cls.nav && cls.nav.videoId) || null,
    title,
    artist: artistRun ? artistRun.text : (albumRun ? null : null),
    artist_id: artistRun ? artistRun.browseId : null,
    artists: artistRun ? [{ artist_id: artistRun.browseId, name: artistRun.text }] : [],
    album: albumRun ? albumRun.text : (plainInfo[1] ? plainInfo[1].text : null),
    album_id: albumRun ? albumRun.browseId : null,
    duration: duration ? duration.trim() : null,
    duration_seconds: duration ? parseHMS(duration) : null,
    release_date: null,
    thumbnail_url: thumbBest(it.thumbnail),
    is_explicit: explicit,
    content_type: 'song',
    streaming: nullStream(),
    playback: nullPlayback()
  };
}

function cleanType(shelfName) {
  if (!shelfName) return 'playlist';
  const t = shelfName.toLowerCase();
  if (t.indexOf('community') !== -1) return 'community';
  if (t.indexOf('featured') !== -1) return 'featured';
  return 'playlist';
}

function playlistUrl(id) {
  const clean = cleanId(id);
  return clean ? `https://music.youtube.com/playlist?list=${clean}` : null;
}

function nullStream() {
  return {
    available: null,
    stream_type: 'official_player',
    player_type: 'youtube_music',
    playback_url: null,
    audio_format: null,
    audio_codec: null,
    audio_quality: null,
    bitrate: null,
    file_size: null,
    expires_at: null
  };
}

function nullPlayback() {
  return {
    is_playable: null,
    is_streaming: null,
    playback_state: null,
    playback_duration: null,
    current_playback_time: null,
    available_quality: [],
    requires_subscription: null
  };
}

function parseSearchResponse(data, opts) {
  const results = { songs: [], music_videos: [], artists: [], albums: [], playlists: [] };
  const tabs = (((data.contents || {}).tabbedSearchResultsRenderer || {}).tabs) || [];
  const sections = ((tabs[0] || {}).tabRenderer || {}).content;
  const sec = (sections && sections.sectionListRenderer && sections.sectionListRenderer.contents) || [];
  let continuation = null;
  const filterChips = [];
  (function chips(qo) {
    if (!qo || typeof qo !== 'object') return;
    if (Array.isArray(qo)) { qo.forEach(chips); return; }
    if (qo.chipCloudChipRenderer) {
      const c = qo.chipCloudChipRenderer;
      const name = (c.text && c.text.runs && c.text.runs[0] && c.text.runs[0].text) || null;
      const p = c.navigationEndpoint && c.navigationEndpoint.searchEndpoint && c.navigationEndpoint.searchEndpoint.params;
      if (name && p) filterChips.push({ name: name.toLowerCase(), params: p });
    }
    for (const k in qo) {
      const v = qo[k];
      if (v && typeof v === 'object') chips(v);
    }
  })(data);

  for (const section of sec) {
    if (section.musicCardShelfRenderer) {
      const card = section.musicCardShelfRenderer;
      const parsed = parseCardShelf(card);
      if (parsed && parsed.type) results[parsed.type].push(parsed.value);
      continue;
    }
    const isr = section.itemSectionRenderer;
    if (!isr || !Array.isArray(isr.contents)) continue;
    for (const one of isr.contents) {
      const it = one.musicResponsiveListItemRenderer;
      if (it) {
        const cls = classifyRow(it, 'all');
        const type = classifyIntoBucket(cls);
        if (type) {
          const value = parseRowByType(it, Object.assign({}, cls, { shelfType: 'all' }));
          results[type].push(value);
        }
      }
    }
  }
  const lastShelf = (sec.filter((s) => s.musicShelfRenderer)[0] || {}).musicShelfRenderer;
  if (lastShelf) {
    const contArr = lastShelf.continuations || [];
    const token0 = contArr[0] && (contArr[0].nextContinuationData && contArr[0].nextContinuationData.continuation);
    if (token0) continuation = token0;
  }
  (sec.filter((s) => s.musicShelfRenderer) || []).forEach((s) => {
    const m = s.musicShelfRenderer;
    const contArr = m.continuations || [];
    const token = contArr[0] && (contArr[0].nextContinuationData && contArr[0].nextContinuationData.continuation);
    if (token && !continuation) continuation = token;
  });
  const cc = data.continuationContents || {};
  const handleRows = (rows, shelfName) => {
    rows.forEach((c) => {
      const it = c.musicResponsiveListItemRenderer;
      if (!it) return;
      const cls = classifyRow(it, shelfName);
      const type = classifyIntoBucket(cls);
      if (type) results[type].push(parseRowByType(it, Object.assign({}, cls, { shelfType: shelfName })));
    });
    const contArr = [];
    (function w(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(w); return; }
      if (o.nextContinuationData || o.continuationItemRenderer) contArr.push(o.nextContinuationData || o.continuationItemRenderer);
      for (const k in o) {
        const v = o[k];
        if (v && typeof v === 'object') w(v);
      }
    })(rows);
    return contArr[0] && (contArr[0].continuation || contArr[0].continuationEndpoint && contArr[0].continuationEndpoint.continuationCommand && contArr[0].continuationEndpoint.continuationCommand.token) || null;
  };
  if (cc.musicShelfContinuation) {
    const tk = handleRows((cc.musicShelfContinuation.contents || cc.musicShelfContinuation.continuationItems || []), opts.shelfName || '');
    if (tk && !continuation) continuation = tk;
  }
  if (cc.sectionListContinuation && cc.sectionListContinuation.continuationItems) {
    cc.sectionListContinuation.continuationItems.forEach((section) => {
      const m = section.musicShelfRenderer || (section.itemSectionRenderer && {}); 
      if (m && m.contents) {
        const shelfName = (m.title && m.title.runs && m.title.runs[0] && m.title.runs[0].text) || opts.shelfName || '';
        const tk = handleRows(m.contents, shelfName);
        if (tk && !continuation) continuation = tk;
      }
    });
  }
  if (opts.includeShelfRows) {
    sec.forEach((section) => {
      const m = section.musicShelfRenderer;
      if (!m) return;
      const shelfName = (m.title && m.title.runs && m.title.runs[0] && m.title.runs[0].text) || '';
      const tk = handleRows(m.contents, shelfName);
      if (tk && !continuation) continuation = tk;
    });
  }
  return { results, filterChips, continuation };
}

function classifyIntoBucket(cls) {
  const label = (cls.label || '').toLowerCase();
  if (/song/.test(label)) return 'songs';
  if (/video/.test(label)) return 'music_videos';
  if (/artist/.test(label)) return 'artists';
  if (/^(album|ep\b|single)/.test(label) || label === 'ep' || label === 'single') return 'albums';
  if (/playlist|podcast/.test(label)) return 'playlists';
  if (/profile|episode/.test(label)) return null;
  return null;
}

function parseCardShelf(card) {
  const titleRuns = runsData(card);
  const h = {
    card: card
  };
  const titleRuns2 = ((card.title || {}).runs) || [];
  const title = titleRuns2.map((r) => r.text).join('').trim();
  let nav = null;
  for (const r of titleRuns2) {
    const n = watchFromNav(r.navigationEndpoint);
    if (n) { nav = n; break; }
  }
  if (!nav && card.navigationEndpoint) nav = watchFromNav(card.navigationEndpoint);
  const buttons = (card.buttons || []);
  for (const b of buttons) {
    const pbn = b.musicPlayButtonRenderer || (b.buttonRenderer && null);
    if (pbn && pbn.playNavigationEndpoint) {
      const n = watchFromNav(pbn.playNavigationEndpoint);
      if (n) { nav = nav || n; }
    }
  }
  const br = buttons[0] || {};
  const subtitle = ((card.subtitle || {}).runs) || [];
  const subData = subtitle.map((r) => ({
    text: r.text || '',
    browseId: r.navigationEndpoint && r.navigationEndpoint.browseEndpoint && r.navigationEndpoint.browseEndpoint.browseId || null
  }));
  const type = nav && nav.videoId ? 'songs' : nav && /^UC/.test(nav.browseId || '') ? 'artists' : nav && /^(MPREb)/.test(nav.browseId || '') ? 'albums' : nav && /^(VL|PL)/.test(nav.browseId || '') ? 'playlists' : null;
  const thumb = card.thumbnail && card.thumbnail.musicThumbnailRenderer ? thumbBest(card.thumbnail.musicThumbnailRenderer) : (card.thumbnail ? thumbBest(card.thumbnail) : null);
  const artist = subData.find((s) => s.browseId && /^UC/.test(s.browseId));
  const album = subData.find((s) => s.browseId && /^MPREb/.test(s.browseId));
  const audience = subtitle.map((r) => r.text).join('').match(/([\d.]+[KMB]?)\s*(subscribers?|monthly audience)/i);
  if (type === 'songs') {
    return {
      type,
      value: {
        video_id: nav.videoId,
        title,
        artist: artist ? artist.text : (album ? album.text : null),
        artist_id: artist ? artist.browseId : null,
        artists: artist ? [{ artist_id: artist.browseId, name: artist.text }] : [],
        album: album ? album.text : (subData[1] ? subData[1].text : null),
        album_id: album ? album.browseId : null,
        duration: null,
        duration_seconds: null,
        release_date: null,
        thumbnail_url: thumb,
        is_explicit: String(JSON.stringify(card)).indexOf('MUSIC_EXPLICIT_BADGE') !== -1,
        content_type: 'song',
        streaming: nullStream(),
        playback: nullPlayback()
      }
    };
  }
  if (type === 'artists') {
    return {
      type,
      value: {
        artist_id: nav.browseId,
        name: title,
        description: null,
        thumbnail_url: thumb,
        subscriber_count: audience && /subscribers/i.test(audience[0]) ? parseCount(audience[1]) : null,
        monthly_audience: audience && /audience/i.test(audience[0]) ? parseCount(audience[1]) : null,
        popular_songs: null,
        albums: null,
        singles: null,
        related_artists: null,
        artist_url: `https://music.youtube.com/channel/${nav.browseId}`
      }
    };
  }
  if (type === 'albums') {
    return {
      type,
      value: {
        album_id: nav.browseId,
        title,
        artist: artist ? artist.text : (subData[0] === undefined ? null : subData.filter((s) => !s.browseId)[0] ? subData.filter((s) => !s.browseId)[0].text : null),
        artist_id: artist ? artist.browseId : null,
        release_date: subtitle.map((r) => r.text).join('').match(/\b(19|20)\d{2}\b/) ? subtitle.map((r) => r.text).join('').match(/\b(19|20)\d{2}\b/)[0] : null,
        total_tracks: null,
        thumbnail_url: thumb,
        album_type: 'album',
        track_list: null
      }
    };
  }
  if (type === 'playlists') {
    return {
      type,
      value: {
        playlist_id: cleanId(nav.browseId),
        title,
        description: null,
        creator: artist ? artist.text : null,
        total_tracks: null,
        thumbnail_url: thumb,
        playlist_type: 'playlist',
        track_list: null,
        playlist_url: playlistUrl(nav.browseId)
      }
    };
  }
  h.type = null;
  return h;
}

async function enrichArtist(artist, bucket, opts) {
  try {
    const bid = artist.artist_id;
    if (!bid || !/^UC/.test(bid)) return artist;
    const data = await browse(bid, null, { label: `artist-${bid}` });
    const tabs0 = (((data.contents || {}).singleColumnBrowseResultsRenderer || {}).tabs) || [];
    const content = ((tabs0[0] || {}).tabRenderer || {}).content;
    const sec = (content && content.sectionListRenderer && content.sectionListRenderer.contents) || [];
    let head = null;
    (function w(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(w); return; }
      if (o.musicImmersiveHeaderRenderer && !head) head = o.musicImmersiveHeaderRenderer;
      for (const k in o) {
        const v = o[k];
        if (v && typeof v === 'object') w(v);
      }
    })(data);
    if (head) {
      if (head.description && head.description.runs) artist.description = head.description.runs.map((r) => r.text).join('');
      const sb = head.subscriptionButton || head.subscriptionButtonRenderer || null;
      const countText = sb && (sb.subscriberCountText || (sb.subscribeButtonRenderer && sb.subscribeButtonRenderer.subscriberCountText) || null);
      if (countText && countText.runs) artist.subscriber_count = parseCount(countText.runs[0].text);
      if (head.monthlyListenerCount && head.monthlyListenerCount.runs) artist.monthly_audience = parseCount(head.monthlyListenerCount.runs[0].text);
    }
    const descShelf = sec.filter((s) => s.musicDescriptionShelfRenderer).map((s) => s.musicDescriptionShelfRenderer)[0];
    if (descShelf && descShelf.description && descShelf.description.runs) {
      artist.description = descShelf.description.runs.map((r) => r.text).join('').trim();
    }
    for (const s of sec) {
      const shelf = s.musicShelfRenderer;
      if (shelf) {
        const shelfName = ((shelf.title || {}).runs || [])[0] && shelf.title.runs[0].text || '';
        (shelf.contents || []).forEach((c) => {
          const row = c.musicResponsiveListItemRenderer;
          if (!row) return;
          const item = parseRowByType(row, { label: 'Song', shelfType: 'Songs' });
          const col0Runs = runsData((row.flexColumns || [])[0]);
          const vid = rowEndpoints(row).videoId || col0Runs.map((r) => r.videoId).find(Boolean);
          if (/song/i.test(shelfName)) {
            artist.popular_songs = artist.popular_songs || [];
            artist.popular_songs.push({
              video_id: vid || item.video_id,
              song_id: vid || item.video_id,
              title: item.title,
              artist_name: item.artist,
              plays: runsData((row.flexColumns || [])[2]).map((r) => r.text).join('') || null,
              thumbnail_url: item.thumbnail_url
            });
          }
        });
      }
      const car = s.musicCarouselShelfRenderer;
      if (car) {
        const carTitle = (((car.header || {}).musicCarouselShelfBasicHeaderRenderer || {}).title || {}).runs;
        const name = carTitle && carTitle[0] ? carTitle[0].text : '';
        const items = (car.contents || []).map((c) => c.musicTwoRowItemRenderer).filter(Boolean).map((it) => ({
          browse_id: (it.navigationEndpoint && it.navigationEndpoint.browseEndpoint && it.navigationEndpoint.browseEndpoint.browseId) || null,
          title: (it.title && it.title.runs && it.title.runs[0] && it.title.runs[0].text) || null,
          subtitle: (it.subtitle && it.subtitle.runs ? it.subtitle.runs.map((r) => r.text).join('') : null),
          year: (it.subtitle && it.subtitle.runs ? it.subtitle.runs.map((r) => r.text).join('') : '').match(/\b(19|20)\d{2}\b/) ? (it.subtitle.runs.map((r) => r.text).join('').match(/\b(19|20)\d{2}\b/)[0]) : null,
          thumbnail_url: thumbBest(it.thumbnail),
          url: it.navigationEndpoint && it.navigationEndpoint.browseEndpoint ? `https://music.youtube.com/${/^(VL|MPSP|PL)/.test(it.navigationEndpoint.browseEndpoint.browseId || '') ? 'playlist' : /^(MPREb)/.test(it.navigationEndpoint.browseEndpoint.browseId || '') ? 'album' : 'channel'}/${it.navigationEndpoint.browseEndpoint.browseId}` : null
        }));
        if (/album/i.test(name)) artist.albums = items;
        else if (/single/i.test(name)) artist.singles = items;
        else if (/fans might/i.test(name)) artist.related_artists = items.filter((x) => /^UC/.test(x.browse_id || '')).map((x) => ({ artist_id: x.browse_id, name: x.title, thumbnail_url: x.thumbnail_url, artist_url: `https://music.youtube.com/channel/${x.browse_id}` }));
        else if (/videos/i.test(name) && !artist.onstage) artist.onstage = items;
      }
    }
  } catch (e) {
    process.stderr.write(`[warn] artist enrich gagal (${artist.artist_id}): ${e.message}\n`);
  }
  return artist;
}

function fillStreamingBlock(song, probe, watchUrl) {
  const f = song.streaming;
  const p = song.playback;
  f.playback_url = watchUrl;
  if (!probe) return;
  const formats = probe.formats || [];
  const audios = formats.filter((x) => /audio/.test(x.mimeType || '') && !(x.hasVideo === true));
  const videos = formats.filter((x) => /video/.test(x.mimeType || '') || x.qualityLabel);
  const best = audios.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
  const labels = [];
  formats.forEach((x) => {
    const l = x.qualityLabel || (x.audioQuality ? String(x.audioQuality).replace('AUDIO_QUALITY_', '').toUpperCase() : null);
    if (l && labels.indexOf(l) === -1) labels.push(l);
  });
  if (best && best.url) {
    f.available = true;
    f.stream_type = 'direct_audio_stream';
    const mime = best.mimeType || '';
    const codec = (mime.match(/codecs="?([^"?]+)/) || [])[1] || null;
    const container = (mime.match(/^audio\/([^;]+)/) || [])[1] || null;
    f.audio_format = container;
    f.audio_codec = codec;
    f.audio_quality = best.audioQuality || (container === 'webm' ? 'AUDIO_QUALITY_HIGH' : null);
    f.bitrate = best.bitrate || null;
    f.file_size = best.contentLength ? parseInt(best.contentLength, 10) : null;
    f.expires_at = probe.expiresInSeconds ? new Date(Date.now() + probe.expiresInSeconds * 1000).toISOString() : null;
    f.stream_url = best.url;
    f.stream_status = probe.status;
    p.is_playable = true;
    p.is_streaming = true;
    p.playback_state = 'ready';
    p.available_quality = labels;
    p.requires_subscription = false;
  } else {
    p.available_quality = labels;
  }
  if (videos.length) {
    const qlabels = videos.map((x) => x.qualityLabel).filter(Boolean);
    f.video_quality = [...new Set(qlabels)].sort((a, b) => (parseInt(b, 10) || 0) - (parseInt(a, 10) || 0));
    const bestVideo = videos.filter((v) => v.url).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    if (bestVideo) {
      f.video_stream_url = bestVideo.url;
      f.video_quality_best = bestVideo.qualityLabel;
    }
  }
}

async function applyStreaming(results, watchUrlFor) {
  const jobs = [];
  const songs = results.songs.slice(0, STREAM_LIMIT);
  const videos = results.music_videos.slice(0, STREAM_LIMIT);
  const seen = new Set();
  for (const s of songs) {
    if (!s.video_id || seen.has(s.video_id)) continue;
    seen.add(s.video_id);
    jobs.push((async () => {
      const probe = await probePlayer(s.video_id);
      if (probe) fillStreamingBlock(s, probe, watchUrlFor(s));
    })());
  }
  for (const v of videos) {
    if (!v.video_id || seen.has(v.video_id)) continue;
    seen.add(v.video_id);
    jobs.push((async () => {
      const probe = await probePlayer(v.video_id);
      if (!probe) return;
      const f = v.streaming = v.streaming || nullStream();
      f.playback_url = v.video_url;
      const formats = probe.formats || [];
      const wl = [...new Set(formats.map((x) => x.qualityLabel).filter(Boolean))];
      f.video_quality = wl;
      f.expires_at = probe.expiresInSeconds ? new Date(Date.now() + probe.expiresInSeconds * 1000).toISOString() : null;
      const bestVideo = formats.filter((x) => /video/.test(x.mimeType || '') && x.url).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      const bestAudio = formats.filter((x) => /audio/.test(x.mimeType || '') && x.url).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      if (bestVideo) {
        f.available = true;
        f.stream_url = bestVideo.url;
        f.stream_quality = bestVideo.qualityLabel;
        f.player_type = 'youtube_music';
        f.stream_type = 'direct_video_stream';
      }
      if (bestAudio) f.audio_stream_url = bestAudio.url;
      v.playback = v.playback || nullPlayback();
      v.playback.is_playable = true;
      v.playback.is_streaming = !!bestVideo;
      v.playback.playback_state = bestVideo ? 'ready' : null;
      v.playback.available_quality = wl;
      v.playback.playback_duration = v.duration_seconds;
      v.playback.current_playback_time = null;
      v.playback.requires_subscription = false;
    })());
  }
  if (jobs.length) await Promise.all(jobs.map((j) => j.catch(() => null)));
}

async function runSearch(query) {
  const t0 = Date.now();
  await ensureSession();
  let discovered = null;
  let discoveredNote = null;
  if (SEARCH_TYPE !== 'all') {
    const firstData = await search(query, null);
    const { filterChips } = parseSearchResponse(firstData, { includeShelfRows: false });
    discovered = filterChips;
  }
  let params = null;
  if (SEARCH_TYPE !== 'all' && discovered) {
    const f = discovered.find((c) => c.name === SEARCH_TYPE) ||
      discovered.find((c) => c.name.split(' ')[0] === SEARCH_TYPE) ||
      discovered.find((c) => c.name.indexOf(SEARCH_TYPE) !== -1);
    if (f) params = f.params;
    else discoveredNote = `filter "${SEARCH_TYPE}" tidak tersedia di YouTube Music (${discovered.map((c) => c.name).join(', ')}), fallback: pencarian tanpa filter`;
  }
  const data = SEARCH_TYPE === 'all' ? await search(query, null) : await search(query, params);
  const include = SEARCH_TYPE !== 'all';
  let firstShelfName = '';
  let parsed = parseSearchResponse(data, { includeShelfRows: include, shelfName: firstShelfName });
  if (SEARCH_TYPE !== 'all') {
    (function w(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(w); return; }
      if (o.musicShelfRenderer && !firstShelfName) firstShelfName = ((o.musicShelfRenderer.title || {}).runs || [])[0] ? o.musicShelfRenderer.title.runs[0].text : '';
      for (const k in o) {
        const v = o[k];
        if (v && typeof v === 'object') w(v);
      }
    })(data);
    if (firstShelfName) parsed = parseSearchResponse(data, { includeShelfRows: true, shelfName: firstShelfName });
  }
  let token = parsed.continuation;
  const pagesFetched = PAGES - 1;
  for (let page = 0; page < pagesFetched && token; page++) {
    process.stderr.write(`[page] ambil continuation ${page + 2}/${PAGES}\n`);
    let contData;
    try {
      contData = await search(query, params, { continuation: token, label: 'search-cont' });
    } catch (e) {
      break;
    }
    const contParsed = parseSearchResponse(contData, { includeShelfRows: true, shelfName: firstShelfName });
    for (const k of ['songs', 'music_videos', 'artists', 'albums', 'playlists']) {
      contParsed.results[k].forEach((v) => parsed.results[k].push(v));
      parsed.results[k] = uniqueByKey(parsed.results[k]);
    }
    token = contParsed.continuation || token;
  }
  if (DEEP_LIMIT > 0 || SEARCH_TYPE === 'artists') {
    const deep = DEEP_LIMIT > 0 ? DEEP_LIMIT : 3;
    const targets = parsed.results.artists.slice(0, deep);
    await Promise.all(targets.map((a) => enrichArtist(a, parsed.results, { order: parsed.results.artists.indexOf(a) })));
  }
  if (DEEP_LIMIT > 0 || SEARCH_TYPE === 'albums') {
    const deep = DEEP_LIMIT > 0 ? DEEP_LIMIT : 3;
    const targets = parsed.results.albums.slice(0, deep);
    await Promise.all(targets.map((a) => enrichAlbum(a)));
  }
  await applyStreaming(parsed.results, (s) => `https://music.youtube.com/watch?v=${s.video_id}`);
  const counts = Object.keys(parsed.results).map((k) => [k, parsed.results[k].length]);
  const total = counts.reduce((acc, [k, v]) => acc + v, 0);
  const out = {
    status: total > 0,
    source: 'YouTube Music',
    query: query,
    search_type: SEARCH_TYPE,
    total_results: total,
    fetched_at: new Date().toISOString(),
    elapsed_ms: Date.now() - t0,
    results: {
      songs: parsed.results.songs,
      music_videos: parsed.results.music_videos,
      artists: parsed.results.artists,
      albums: parsed.results.albums,
      playlists: parsed.results.playlists
    },
    pagination: {
      has_more: !!token,
      continuation_token: token || null,
      next_page: token ? { pages: PAGES + 1 } : null
    },
    search_metadata: {
      search_query: query,
      search_filter: SEARCH_TYPE,
      available_filters: (parsed.filterChips && parsed.filterChips.length ? parsed.filterChips.map((c) => c.name) : ['songs', 'videos', 'artists', 'albums', 'playlists']),
      region: GL,
      language: HL,
      filter_note: discoveredNote
    }
  };
  return out;
}

async function enrichAlbum(album) {
  try {
    const bid = album.album_id;
    if (!bid) return album;
    const data = await browse(bid, null, { label: `album-${bid}` });
    const tw = (data.contents || {}).twoColumnBrowseResultsRenderer || null;
    let head = null;
    (function w(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(w); return; }
      if (o.musicResponsiveHeaderRenderer && !head) head = o.musicResponsiveHeaderRenderer;
      for (const k in o) {
        const v = o[k];
        if (v && typeof v === 'object') w(v);
      }
    })(data);
    let shelf = null;
    (function w2(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(w2); return; }
      if (o.musicPlaylistShelfRenderer && !shelf) shelf = o.musicPlaylistShelfRenderer;
      if (o.musicShelfRenderer && !shelf) shelf = o.musicShelfRenderer;
      for (const k in o) {
        const v = o[k];
        if (v && typeof v === 'object') w2(v);
      }
    })(data);
    if (head) {
      const strap = ((head.straplineTextOne || {}).runs || [])[0] ? head.straplineTextOne.runs[0].text : null;
      if (strap && !album.artist) {
        album.artist = strap;
        const strapNav = (((head.straplineTextOne || {}).runs || [])[0] || {}).navigationEndpoint;
        const be = strapNav && strapNav.browseEndpoint;
        if (be && /^UC/.test(be.browseId || '')) album.artist_id = album.artist_id || be.browseId;
      }
      const subTitle = ((head.subtitle || {}).runs || []).map((r) => r.text).join('');
      if (subTitle) {
        const yr = subTitle.match(/\b(19|20)\d{2}\b/);
        if (yr) album.release_date = album.release_date || yr[0];
      }
      const second = ((head.secondSubtitle || {}).runs || []).map((r) => r.text).join('');
      const tmatch = second && second.match(/(\d+)\s*(songs|tracks)/i);
      if (tmatch) album.total_tracks = parseInt(tmatch[1], 10);
      if (second && /minutes/i.test(second)) album.duration_total = second;
      const desc = (head.description || {}).runs;
      if (desc && desc.length) album.description = desc.map((r) => r.text).join('').trim();
    }
    if (shelf) {
      album.track_list = (shelf.contents || []).map((c, i) => {
        const row = c.musicResponsiveListItemRenderer;
        if (!row) return null;
        const nav = rowEndpoints(row);
        const t = colText((row.flexColumns || [])[0]);
        const d1 = runsData((row.flexColumns || [])[1]);
        const artistRun = d1.find((r) => r.browseId && /^UC/.test(r.browseId));
        const plain = d1.filter((r) => !r.nav && r.text);
        const dur = plain.map((r) => r.text).reverse().find((t2) => parseHMS(t2) != null);
        return {
          track_no: i + 1,
          video_id: nav.videoId || null,
          title: t,
          artist: artistRun ? artistRun.text : (album.artist || null),
          duration: dur ? dur.trim() : null,
          duration_seconds: dur ? parseHMS(dur) : null,
          plays: (runsData((row.flexColumns || [])[2]).map((r) => r.text).join('') || null)
        };
      }).filter(Boolean);
      if (album.track_list.length && !album.total_tracks) album.total_tracks = album.track_list.length;
    }
  } catch (e) {
    process.stderr.write(`[warn] album enrich gagal (${album.album_id}): ${e.message}\n`);
  }
  return album;
}

function uniqueByKey(list) {
  const seen = new Set();
  return list.filter((x) => {
    const k = (x.video_id || x.playlist_id || x.artist_id || x.album_id || '') + '|' + (x.title || x.name || '');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseTwoRowItem(it, ctx) {
  const title = ((it.title || {}).runs || []).map((r) => r.text).join('').trim();
  const nav = (it.navigationEndpoint && watchFromNav(it.navigationEndpoint)) || {};
  const subs = (it.subtitle && it.subtitle.runs ? it.subtitle.runs : (it.subtitleRuns && it.subtitleRuns.runs ? it.subtitleRuns.runs : []));
  const subData = subs.map((r) => ({
    text: r.text || '',
    browseId: r.navigationEndpoint && r.navigationEndpoint.browseEndpoint && r.navigationEndpoint.browseEndpoint.browseId || null
  }));
  const artist = subData.find((s) => s.browseId && /^UC/.test(s.browseId));
  const subtitlePlain = subData.filter((s) => !s.browseId).map((s) => s.text.trim()).filter(Boolean);
  const thumb = thumbBest(it.thumbnail);
  const musicVideoType = ((it.navigationEndpoint || {}).watchEndpoint || {}).watchEndpointMusicSupportedConfigs;

  function pickYear(txt) {
    const m = txt.match(/\b(19|20)\d{2}\b/);
    return m ? m[0] : null;
  }

  if (ctx === 'new-releases') {
    return {
      item_type: 'album',
      album_id: nav.browseId || null,
      title,
      artist: artist ? artist.text : (subtitlePlain[0] || null),
      artist_id: artist ? artist.browseId : null,
      playlist_id: /^MPSP/.test(nav.browseId || '') ? nav.browseId : null,
      release_date: pickYear(subData.map((s) => s.text).join(' ')),
      thumbnail_url: thumb
    };
  }
  if (nav.browseId && /^(VL|PL|MPSP|OLA)/.test(nav.browseId)) {
    return {
      item_type: 'playlist',
      playlist_id: cleanId(nav.browseId),
      title,
      creator: artist ? artist.text : (subtitlePlain[subtitlePlain.length - 1] || null),
      total_tracks: null,
      thumbnail_url: thumb,
      playlist_url: playlistUrl(nav.browseId)
    };
  }
  if (nav.videoId) {
    return {
      item_type: 'song',
      video_id: nav.videoId,
      title,
      artist: artist ? artist.text : (subtitlePlain[0] || null),
      artist_id: artist ? artist.browseId : null,
      plays: /play|view/i.test(subData.map((s) => s.text).join(' ')) ? parseCount(subData.map((s) => s.text).join(' ')) : null,
      thumbnail_url: thumb,
      playback_url: `https://music.youtube.com/watch?v=${nav.videoId}`
    };
  }
  if (nav.browseId && /^MPREb/.test(nav.browseId)) {
    return {
      item_type: 'album',
      album_id: nav.browseId,
      title,
      artist: artist ? artist.text : (subtitlePlain[0] || null),
      artist_id: artist ? artist.browseId : null,
      album_url: `https://music.youtube.com/album/${nav.browseId}`,
      release_date: pickYear(subData.map((s) => s.text).join(' ')),
      thumbnail_url: thumb
    };
  }
  if (nav.browseId && /^UC/.test(nav.browseId)) {
    return {
      item_type: 'artist',
      artist_id: nav.browseId,
      name: title,
      subscriber_or_audience: /audience|subscriber/i.test(subData.map((s) => s.text).join(' ')) ? parseCount(subData.map((s) => s.text).join(' ')) : null,
      thumbnail_url: thumb,
      artist_url: `https://music.youtube.com/channel/${nav.browseId}`
    };
  }
  return { item_type: Object.keys(it)[0], title, thumbnail_url: thumb, endpoint: nav.browseId || nav.videoId || null };
}

async function fetchCarouselShelves(browseId, extra, opts = {}) {
  const data = await browse(browseId, extra && extra.params, { label: `browse-${browseId}` });
  const shelves = [];
  (function w(o) {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(w); return; }
    for (const k in o) {
      if (k === 'musicCarouselShelfRenderer' || k === 'musicShelfRenderer' || k === 'gridRenderer' || k === 'musicChartShelfRenderer') {
        shelves.push({ key: k, renderer: o[k] });
      }
      const v = o[k];
      if (v && typeof v === 'object') w(v);
    }
  })(data);
  let out = [];
  for (const de of shelves) {
    if (de.key === 'gridRenderer') {
      const g = de.renderer;
      (g.items || []).forEach((it) => {
        const btn = it.musicNavigationButtonRenderer;
        if (!btn) return;
        const be = (btn.clickCommand || {}).browseEndpoint || {};
        const text = ((btn.buttonText || {}).runs || [])[0] ? btn.buttonText.runs[0].text : (((btn.solid || {}).headerCase || {})).text;
        out.push({
          section_id: null,
          section_name: text || null,
          section_type: 'grid_button',
          section_position: out.length,
          section_items: [],
          browse_id: be.browseId || null,
          browse_params: be.params || null
        });
      });
    }
  }
  let list = [];
  for (const de of shelves) {
    if (de.key === 'musicCarouselShelfRenderer') {
      const car = de.renderer;
      const headerTitle = (((car.header || {}).musicCarouselShelfBasicHeaderRenderer || {}).title || {}).runs;
      const name = headerTitle && headerTitle[0] ? headerTitle[0].text : null;
      const items = (car.contents || []).map((c) => {
        const tr = c.musicTwoRowItemRenderer;
        if (tr) return { rkey: 'musicTwoRowItemRenderer', it: tr };
        const rl = c.musicResponsiveListItemRenderer;
        if (rl) return { rkey: 'musicResponsiveListItemRenderer', it: rl };
        const nav = c.musicNavigationButtonRenderer;
        if (nav) return { rkey: 'musicNavigationButtonRenderer', it: nav };
        return null;
      }).filter(Boolean);
      const be = headerTitle && car.header && car.header.musicCarouselShelfBasicHeaderRenderer && car.header.musicCarouselShelfBasicHeaderRenderer.title && car.header.musicCarouselShelfBasicHeaderRenderer.title.runs && car.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0] && car.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].navigationEndpoint ? car.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].navigationEndpoint.browseEndpoint : {};
      list.push({
        section_id: (be && be.browseId) || null,
        section_name: name,
        section_type: de.key === 'musicShelfRenderer' ? 'shelf' : 'carousel',
        section_position: list.length,
        items,
        more_param: be && be.browseId === 'FEmusic_moods_and_genres_category' ? be.params : null
      });
    }
  }
  for (const de of shelves) {
    if (de.key === 'musicShelfRenderer') {
      const m = de.renderer;
      const name = ((m.title || {}).runs || [])[0] ? m.title.runs[0].text : null;
      const items = (m.contents || []).map((c) => {
        const rl = c.musicResponsiveListItemRenderer;
        if (rl) return { rkey: 'musicResponsiveListItemRenderer', it: rl };
        const tr = c.musicTwoRowItemRenderer;
        if (tr) return { rkey: 'musicTwoRowItemRenderer', it: tr };
        return null;
      }).filter(Boolean);
      list.push({
        section_id: null,
        section_name: name,
        section_type: 'shelf',
        section_position: list.length,
        items
      });
    }
  }
  return { data, shelves: list, shelfArea: out.length ? out : null, raw: data };
}

async function fetchHomeFlow() {
  const data = await browse('FEmusic_home', null, { label: 'home' });
  const slr0 = (((((data.contents || {}).singleColumnBrowseResultsRenderer || {}).tabs || [])[0] || {}).tabRenderer || {}).content;
  const slr = (slr0 && slr0.sectionListRenderer) || {};
  let sections = [];
  let pos = 0;
  (function w(items) {
    for (const s of items) {
      const car = s.musicCarouselShelfRenderer;
      if (car) {
        const name = (((car.header || {}).musicCarouselShelfBasicHeaderRenderer || {}).title || {}).runs;
        sections.push({
          section_id: null,
          section_name: name && name[0] ? name[0].text : null,
          section_type: 'carousel',
          section_position: pos++,
          section_items: (car.contents || []).map((c) => c.musicTwoRowItemRenderer ? { rkey: 'musicTwoRowItemRenderer', it: c.musicTwoRowItemRenderer } : c.musicResponsiveListItemRenderer ? { rkey: 'musicResponsiveListItemRenderer', it: c.musicResponsiveListItemRenderer } : null).filter(Boolean)
        });
      }
      const sh = s.musicShelfRenderer;
      if (sh) {
        const name = ((sh.title || {}).runs || [])[0];
        sections.push({
          section_id: null,
          section_name: name ? name.text : null,
          section_type: 'shelf',
          section_position: pos++,
          section_items: (sh.contents || []).map((c) => c.musicResponsiveListItemRenderer ? { rkey: 'musicResponsiveListItemRenderer', it: c.musicResponsiveListItemRenderer } : null).filter(Boolean)
        });
      }
    }
  })(slr.contents || []);
  const contArr = slr.continuations || [];
  let token = contArr[0] ? contArr[0].nextContinuationData && contArr[0].nextContinuationData.continuation : null;
  let pages = 1;
  if (token) {
    try {
      const contData = await browse('FEmusic_home', null, { continuation: token, label: 'home-cont' });
      const slrCont = (((contData.contents || {}).singleColumnBrowseResultsRenderer || {}).tabs || [])[0];
      const contContent = (((slrCont || {}).tabRenderer || {}).content || {});
      (function w(items) {
        for (const s of items) {
          const car = s.musicCarouselShelfRenderer;
          if (car) {
            const name = (((car.header || {}).musicCarouselShelfBasicHeaderRenderer || {}).title || {}).runs;
            sections.push({
              section_id: null,
              section_name: name && name[0] ? name[0].text : null,
              section_type: 'carousel',
              section_position: pos++,
              section_items: (car.contents || []).map((c) => c.musicTwoRowItemRenderer ? { rkey: 'musicTwoRowItemRenderer', it: c.musicTwoRowItemRenderer } : c.musicResponsiveListItemRenderer ? { rkey: 'musicResponsiveListItemRenderer', it: c.musicResponsiveListItemRenderer } : null).filter(Boolean)
            });
            pages = 2;
          }
        }
      })(contContent.sectionListRenderer && contContent.sectionListRenderer.contents || []);
    } catch (e) {
      process.stderr.write(`[warn] home continuation gagal: ${e.message}\n`);
    }
  }
  const mapped = sections.map((sec) => ({
    section_id: sec.section_id,
    section_name: sec.section_name,
    section_type: sec.section_type,
    section_position: sec.section_position,
    section_items: sec.section_items.map((x) => x.rkey === 'musicResponsiveListItemRenderer'
      ? parseHomeQuickPick(x.it)
      : parseTwoRowItem(x.it, 'home')).filter(Boolean)
  }));
  return { sections: mapped, pages };
}

function parseHomeQuickPick(it) {
  const col0 = (it.flexColumns || [])[0];
  const col1 = (it.flexColumns || [])[1];
  const col2txt = colText((it.flexColumns || [])[2]);
  const title = colText(col0);
  const data = runsData(col1);
  const navRun = (title && data.find((r) => r.nav && r.nav.watchEndpoint)) || null;
  const we = ((runsData(col0)[0] || {}).nav || {}).watchEndpoint;
  const artistRun = data.find((r) => r.browseId && /^UC/.test(r.browseId));
  const playMatch = data.map((r) => r.text).join(' ').match(/([\d.,]+[KMB]?)\s*(plays?|views?)/i);
  if (we && we.videoId) {
    return {
      item_type: 'song',
      video_id: we.videoId,
      song_id: we.videoId,
      title,
      artist: artistRun ? artistRun.text : null,
      artist_id: artistRun ? artistRun.browseId : null,
      plays: playMatch ? parseCount(playMatch[0]) : null,
      album_name: col2txt || null,
      thumbnail_url: thumbBest(it.thumbnail),
      playback_url: `https://music.youtube.com/watch?v=${we.videoId}`
    };
  }
  const anyNav = rowEndpoints(it);
  return { item_type: 'unknown', title, thumbnail_url: thumbBest(it.thumbnail), endpoint: anyNav.browseId || anyNav.videoId || null };
}

async function fetchChartsFlow() {
  const data = await browse('FEmusic_charts', null, { label: 'charts' });
  const slr = ((((data.contents || {}).singleColumnBrowseResultsRenderer || {}).tabs || [])[0] || {}).tabRenderer;
  const sec = (((slr || {}).content || {}).sectionListRenderer || {}).contents || [];
  let region = null;
  let menuRegions = [];
  let charts = [];
  const regionArea = sec.filter((s) => s.musicShelfRenderer).map((s) => s.musicShelfRenderer)[0];
  if (regionArea) {
    const sub = regionArea.subheaders || [];
    sub.forEach((x) => {
      const items = (x.musicSideAlignedItemRenderer || {}).startItems || [];
      items.forEach((y) => {
        const btn = y.musicSortFilterButtonRenderer;
        if (btn) {
          region = ((btn.title || {}).runs || [])[0] ? btn.title.runs[0].text : region;
          const options = (((btn.menu || {}).musicMultiSelectMenuRenderer || {}).options) || [];
          options.forEach((op) => {
            const r0 = op.musicMultiSelectMenuItemRenderer;
            if (r0) menuRegions.push((r0.title || {}).runs ? r0.title.runs[0].text : null);
          });
        }
      });
    });
  }
  for (const s of sec) {
    const car = s.musicCarouselShelfRenderer;
    if (!car) continue;
    const header = (((car.header || {}).musicCarouselShelfBasicHeaderRenderer || {}).title || {}).runs;
    const carName = header && header[0] ? header[0].text : null;
    (car.contents || []).forEach((c) => {
      const tr = c.musicTwoRowItemRenderer;
      if (!tr) return;
      const nav = watchFromNav(tr.navigationEndpoint) || {};
      const title = ((tr.title || {}).runs || []).map((r) => r.text).join('').trim();
      const sub = ((tr.subtitle || {}).runs || []).map((r) => r.text).join('');
      charts.push({
        chart_name: title,
        chart_region: region,
        chart_type: carName,
        playlist_id: cleanId(nav.browseId) || null,
        chart_id: nav.browseId || null,
        subtitle: sub || null,
        thumbnail_url: thumbBest(tr.thumbnail)
      });
    });
    const artistRows = (car.contents || []).map((c) => c.musicResponsiveListItemRenderer).filter(Boolean);
    if (carName && /^Top artists/i.test(carName) && artistRows.length) {
      const items = artistRows.slice(0, CHART_ITEMS).map((row, i) => {
        const nav = rowEndpoints(row);
        const title = colText((row.flexColumns || [])[0]);
        const artistName = title || null;
        return {
          chart_name: carName,
          chart_region: region,
          rank: i + 1,
          song_id: null,
          song_title: null,
          artist_name: artistName,
          artist_id: nav.browseId || null,
          thumbnail_url: thumbBest(row.thumbnail),
          item_type: 'artist'
        };
      });
      charts.push({ carousel: 'artists', items });
    }
  }
  const resolved = [];
  for (const chart of charts.filter((c) => c.playlist_id)) {
    try {
      const vdata = await browse('VL' + chart.playlist_id, null, { label: `chart-${chart.playlist_id}` });
      let shelf = null;
      (function w(qo) {
        if (!qo || typeof qo !== 'object') return;
        if (Array.isArray(qo)) { qo.forEach(w); return; }
        if (qo.musicPlaylistShelfRenderer && !shelf) shelf = qo.musicPlaylistShelfRenderer;
        for (const k in qo) {
          const v = qo[k];
          if (v && typeof v === 'object') w(v);
        }
      })(vdata);
      const items = [];
      (shelf ? shelf.contents || [] : []).slice(0, CHART_ITEMS).forEach((c, i) => {
        const row = c.musicResponsiveListItemRenderer;
        if (!row) return;
        const nav = rowEndpoints(row);
        const title = colText((row.flexColumns || [])[0]);
        const data2 = runsData((row.flexColumns || [])[1]);
        const artistRun = data2.find((r) => r.browseId && /^UC/.test(r.browseId));
        items.push({
          chart_name: chart.chart_name,
          chart_region: region,
          chart_update_date: null,
          rank: i + 1,
          song_id: nav.videoId || null,
          song_title: title,
          artist_name: artistRun ? artistRun.text : (data2.filter((r) => !r.nav).map((r) => r.text).join('') || null),
          artist_id: artistRun ? artistRun.browseId : null,
          thumbnail_url: thumbBest(row.thumbnail)
        });
      });
      resolved.push({ chart_name: chart.chart_name, chart_region: region, chart_type: chart.chart_type, chart_id: chart.playlist_id, items });
    } catch (e) {
      resolved.push(chart);
      process.stderr.write(`[warn] chart ${chart.chart_name} gagal dibrowse: ${e.message}\n`);
    }
  }
  charts.filter((c) => c.carousel === 'artists').forEach((c) => resolved.push({
    chart_name: c.items[0] ? c.items[0].chart_name : 'Top artists',
    chart_region: region,
    chart_type: 'Top artists',
    chart_id: null,
    items: c.items
  }));
  return { region, menuRegions, charts: resolved.filter((c) => c.items === undefined ? true : (c.items && c.items.length)) };
}

async function fetchMoodsFlow() {
  const data = await browse('FEmusic_moods_and_genres', null, { label: 'moods' });
  const slr = ((((data.contents || {}).singleColumnBrowseResultsRenderer || {}).tabs || [])[0] || {}).tabRenderer;
  const sec = (((slr || {}).content || {}).sectionListRenderer || {}).contents || [];
  const grids = sec.filter((s) => s.gridRenderer).map((s) => s.gridRenderer);
  const moods = [];
  for (let gi = 0; gi < grids.length; gi++) {
    const g = grids[gi];
    const isGenre = gi === 1;
    (g.items || []).forEach((it) => {
      const btn = it.musicNavigationButtonRenderer;
      if (!btn) return;
      const be = ((btn.clickCommand || {}).browseEndpoint) || {};
      moods.push({
        mood_name: isGenre ? null : (((btn.buttonText || {}).runs || [])[0] ? btn.buttonText.runs[0].text : null),
        genre_name: isGenre ? (((btn.buttonText || {}).runs || [])[0] ? btn.buttonText.runs[0].text : null) : null,
        activity_name: isGenre ? null : (((btn.buttonText || {}).runs || [])[0] ? btn.buttonText.runs[0].text : null),
        browse_id: be.browseId || null,
        params: be.params || null,
        playlist_list: null
      });
    });
  }
  const deep = moods.filter((m) => m.params).slice(0, MOODS_DEEP);
  const output = await Promise.all(deep.map(async (m) => {
    try {
      const mdata = await browse('FEmusic_moods_and_genres_category', m.params, { label: `mood-${m.mood_name || m.genre_name}` });
      const slrc = (((((mdata.contents || {}).singleColumnBrowseResultsRenderer || {}).tabs || [])[0] || {}).tabRenderer || {}).content;
      const msec = (slrc && slrc.sectionListRenderer && slrc.sectionListRenderer.contents) || [];
      const pls = [];
      for (const s of msec) {
        const car = s.musicCarouselShelfRenderer;
        if (!car) continue;
        const carName = (((car.header || {}).musicCarouselShelfBasicHeaderRenderer || {}).title || {}).runs;
        (car.contents || []).slice(0, Math.max(10, Math.ceil(30 / Math.max(1, deep.length / 2)))).forEach((c) => {
          const tr = c.musicTwoRowItemRenderer;
          if (!tr) return;
          const nav = watchFromNav(tr.navigationEndpoint) || {};
          if (!(nav.browseId && /^(VL|PL|MPSP|OLA)/.test(nav.browseId))) return;
          const t = ((tr.title || {}).runs || []).map((r) => r.text).join('').trim();
          const sub = ((tr.subtitle || {}).runs || []).map((r) => r.text).join('');
          pls.push({
            playlist_id: cleanId(nav.browseId),
            title: t,
            creator: /YouTube Music/i.test(sub) ? 'YouTube Music' : (sub.split('•')[1] || '').trim() || null,
            playlist_type: carName ? carName[0].text && carName[0].text : null,
            thumbnail_url: thumbBest(tr.thumbnail)
          });
        });
        if (pls.length >= 15) break;
      }
      m.playlist_list = pls.slice(0, 15);
    } catch (e) {
      process.stderr.write(`[warn] mood browse gagal (${m.mood_name || m.genre_name}): ${e.message}\n`);
      m.playlist_list = null;
    }
    return m;
  }));
  return moods.map((m) => output.find((x) => x === m) || m);
}

async function fetchCategoriesFlow() {
  const data = await browse('FEmusic_explore', null, { label: 'explore' });
  const slr = ((((data.contents || {}).singleColumnBrowseResultsRenderer || {}).tabs || [])[0] || {}).tabRenderer;
  const sec = (((slr || {}).content || {}).sectionListRenderer || {}).contents || [];
  const categories = [];
  const carousels = [];
  sec.forEach((s) => {
    if (s.gridRenderer) {
      (s.gridRenderer.items || []).forEach((it) => {
        const btn = it.musicNavigationButtonRenderer;
        if (!btn) return;
        const be = ((btn.clickCommand || {}).browseEndpoint) || {};
        const name = (((btn.buttonText || {}).runs || [])[0] ? btn.buttonText.runs[0].text : null);
        categories.push({
          category_id: be.browseId || null,
          category_name: name,
          category_type: /\bmoods/i.test(name || '') ? 'moods_and_genres' : /charts?/i.test(name || '') ? 'charts' : /new releases?/i.test(name || '') ? 'new_releases' : 'category',
          category_description: null,
          category_thumbnail: null,
          browse_params: be.params || null,
          category_items: null
        });
      });
    }
    if (s.musicCarouselShelfRenderer) {
      const car = s.musicCarouselShelfRenderer;
      const name = (((car.header || {}).musicCarouselShelfBasicHeaderRenderer || {}).title || {}).runs;
      carousels.push({ name: (name || [])[0] ? name[0].text : null, itemsCount: (car.contents || []).length });
    }
  });
  for (const cat of categories.slice(0, 3)) {
    if (/charts?/i.test(cat.category_name || '')) {
      try {
        const cdata = await browse('FEmusic_charts', null, { label: 'category-charts' });
        const slrc = (((((cdata.contents || {}).singleColumnBrowseResultsRenderer || {}).tabs || [])[0] || {}).tabRenderer || {}).content;
        const msec = (slrc && slrc.sectionListRenderer && slrc.sectionListRenderer.contents) || [];
        const items = [];
        msec.forEach((s) => {
          const car = s.musicCarouselShelfRenderer;
          if (!car) return;
          (car.contents || []).forEach((c) => {
            const tr = c.musicTwoRowItemRenderer;
            if (!tr) return;
            const name = ((tr.title || {}).runs || []).map((r) => r.text).join('').trim();
            items.push({ item_type: 'chart', chart_name: name, playlist_id: cleanId(watchFromNav(tr.navigationEndpoint).browseId) || null, thumbnail_url: thumbBest(tr.thumbnail) });
          });
        });
        cat.category_items = items;
      } catch (e) {
        cat.category_items = ['charts layout mungkin berubah: ' + e.message];
      }
      continue;
    }
    try {
      const cdata = await browse(cat.category_id, null, { label: `category-${cat.category_id}` });
      const slrc = (((((cdata.contents || {}).singleColumnBrowseResultsRenderer || {}).tabs || [])[0] || {}).tabRenderer || {}).content;
      const msec = (slrc && slrc.sectionListRenderer && slrc.sectionListRenderer.contents) || [];
      const items = [];
      const grids = msec.filter((s) => s.gridRenderer);
      for (const g0 of grids) {
        (g0.gridRenderer.items || []).forEach((it) => {
          const btn = it.musicNavigationButtonRenderer;
          if (!btn) return;
          const be = ((btn.clickCommand || {}).browseEndpoint) || {};
          items.push({
            item_type: 'mood_or_genre',
            mood_or_genre: (((btn.buttonText || {}).runs || [])[0] ? btn.buttonText.runs[0].text : null),
            browse_id: be.browseId || null,
            params: be.params || null
          });
        });
      }
      for (const s of msec) {
        const car = s.musicCarouselShelfRenderer;
        if (car) {
          const carName = (((car.header || {}).musicCarouselShelfBasicHeaderRenderer || {}).title || {}).runs;
          (car.contents || []).forEach((c) => {
            const tr = c.musicTwoRowItemRenderer;
            if (!tr) return;
            items.push(Object.assign({ shelf: carName ? carName[0].text : null }, parseTwoRowItem(tr, /new releases?/i.test(cat.category_name || '') ? 'new-releases' : null)));
          });
        }
      }
      cat.category_items = items.slice(0, CATEGORY_ITEMS);
      cat.shelves = carouselsNameList(msec);
    } catch (e) {
      cat.category_items = null;
      process.stderr.write(`[warn] kategori gagal: ${e.message}\n`);
    }
  }
  return {
    categories: categories,
    carousels: carousels
  };
}

function carouselsNameList(msec) {
  return msec.filter((s) => s.musicCarouselShelfRenderer).map((s) => {
    const car = s.musicCarouselShelfRenderer;
    const n = (((car.header || {}).musicCarouselShelfBasicHeaderRenderer || {}).title || {}).runs;
    return { name: (n || [])[0] ? n[0].text : null, count: (car.contents || []).length };
  });
}

async function runFull() {
  const t0 = Date.now();
  await ensureSession();
  const [home, charts, moods, categories] = await Promise.allSettled([fetchHomeFlow(), fetchChartsFlow(), fetchMoodsFlow(), fetchCategoriesFlow()]);
  const okh = home.status === 'fulfilled' ? home.value : null;
  const okc = charts.status === 'fulfilled' ? charts.value : null;
  const okm = moods.status === 'fulfilled' ? moods.value : null;
  const okcat = categories.status === 'fulfilled' ? categories.value : null;
  const failures = [
    ['home', home], ['charts', charts], ['moods', moods], ['categories', categories]
  ].filter(([, p]) => p.status === 'rejected').map(([n, p]) => ({ part: n, error: String(p.reason && p.reason.message) }));
  const out = {
    status: failures.length === 0,
    source: 'YouTube Music',
    mode: 'full',
    fetched_at: new Date().toISOString(),
    elapsed_ms: Date.now() - t0,
    results: {
      home_sections: okh ? okh.sections : [],
      categories: okcat ? (okcat.categories.length ? okcat.categories : okcat) : [],
      moods_genres: okm || [],
      charts: okc ? okc.charts : []
    },
    metadata: {
      region: okc ? okc.region : GL,
      language: HL,
      chart_regions_available: okc ? okc.menuRegions : null,
      home_pages_fetched: okh ? okh.pages : null,
      explore_carousels: okcat ? okcat.carousels : null,
      config: { client: 'WEB_REMIX', client_version: state.clientVersion, gl: GL, hl: HL },
      warnings: failures
    }
  };
  if (okc && okc.charts.length === 0 && !failures.some((f) => f.part === 'charts')) {
    failures.push({ part: 'charts', error: 'charts kosong' });
  }
  if (failures.length) {
    out.status = false;
    out.metadata.warnings = failures;
  }
  return out;
}

async function main() {
  const query = positional.join(' ').trim();
  if (flags.full) {
    const out = await runFull();
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    process.exitCode = out.status ? 0 : 2;
    return;
  }
  if (!query) {
    process.stdout.write(JSON.stringify({ status: false, error: 'query kosong', help: USAGE }, null, 2) + '\n');
    process.exitCode = 1;
    return;
  }
  const out = await runSearch(query);
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  process.exitCode = out.status ? 0 : 2;
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({
    status: false,
    source: 'YouTube Music',
    error: (e && e.message) || String(e),
    hint: 'Periksa jaringan/koneksi. Script otomatis retry; tingkatkan YTM_RETRIES=infinite agar terus mencoba.',
    help: USAGE
  }, null, 2) + '\n');
  process.exitCode = 1;
});
