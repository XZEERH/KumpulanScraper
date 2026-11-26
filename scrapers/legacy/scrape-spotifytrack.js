"use strict";

/**
 * Name : Metadata Spotify
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://open.spotify.com/intl-id
 * Type : Scraper
 * Description : -
 * Note : Lengkap banget, dari metadata lagu: tittle, artists, album, album_type, cover_url, duration_ms, release_date, track_number, disc_number, track_id, track_url

metadata artist: artist_name, artist_id, artist_url, artist_url, artist_images, genres, followers, popularity

metadata album: album_name, album_id, album_type, album_url, album_url, cover_url, release_date, release_date_precision, total_track, artist

metadata playlist: playlist_name, playlist_id, playlist_url, description, cover_images, owner, tracks, total_tracks. Btw error fix sendiri
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

/* =========================================================================
 * Konfigurasi
 * ======================================================================= */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const EMBED_BASE = "https://open.spotify.com";
const PATHFINDER = "https://api-partner.spotify.com/pathfinder/v1/query";

// Halaman embed publik sebagai sumber anonymous token (fallback berlapis).
const TOKEN_SOURCES = [
  "/embed/track/0VjIjW4GlUZAMYd2vXMi3b", // Blinding Lights
  "/embed/playlist/37i9dQZF1DXcBWIGoYBM5M", // Today's Top Hits
  "/embed/album/4yP0hdKOZPNshxUOjY0cZj", // After Hours
];

// Hash persisted query diekstrak dari bundle web player Spotify.
// Kalau suatu operasi berubah hash, bagian lain tetap diproses.
const QUERIES = {
  searchTracks: { hash: "b02683192a98dde7966b5e6655a79eeb62713eab703eda9902c932818dd52751" },
  searchArtists: { hash: "7bf95d754fdbe32c8b161fbbe54d1ae50974900df4dce4c8f1afcbcad153224d" },
  searchAlbums: { hash: "202cb3305e31e5a0767ba7925f28bd728cf8f8b0217e6da43909056071cd70e9" },
  searchPlaylists: { hash: "d520014e748f9ea44f7707d8df1819867ac1205e8b7f3e28f22fe5fc858921b1" },
  getTrack: { hash: "fe16b8083eec2305854db612ca75589bcb71e009dc7a4d014f29bd534a4c01f5" },
  getAlbum: { hash: "0b6ce3511e1b02e4a40fa95440f992acbe85080eb308af9194322d708fc1914f" },
  queryArtistOverview: { hash: "9f8134ef565e78621f1e1793555bd6633c5ac144ae0f89604ed3ae3f80b3c8e6" },
  fetchPlaylistMetadata: { hash: "21ea11a6ac75a5f3e01fd365d29c18e0a4a8b7dc09f89bbb5d73910190c6acaf" },
  fetchPlaylistContents: { hash: "21ea11a6ac75a5f3e01fd365d29c18e0a4a8b7dc09f89bbb5d73910190c6acaf" },
};

const PAGE_LIMIT = 50;
const REQUEST_TIMEOUT = 25000;
const DEFAULT_LIMIT = 1;
const MAX_PLAYLIST_TRACKS = 500;

/* =========================================================================
 * Util
 * ======================================================================= */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (msg) => {
  process.stderr.write(`[spotify] ${msg}\n`);
};

function uriToId(uri) {
  if (typeof uri !== "string") return null;
  const parts = uri.split(":");
  return parts.length ? parts[parts.length - 1] : null;
}

function entityUrl(type, id) {
  if (!id) return null;
  return `https://open.spotify.com/${type}/${id}`;
}

function imageWidth(s) {
  return (s && (s.width || s.maxWidth)) || 0;
}

// Pilih satu URL gambar terbesar yang masih <= 640px (fallback: yang terbesar).
function bestImage(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  const valid = sources.filter((s) => s && s.url);
  if (!valid.length) return null;
  const sorted = [...valid].sort((a, b) => imageWidth(b) - imageWidth(a));
  const fit = sorted.filter((s) => imageWidth(s) > 0 && imageWidth(s) <= 640);
  return (fit[0] || sorted[0]).url;
}

function imageUrls(sources) {
  if (!Array.isArray(sources)) return [];
  return sources.filter((s) => s && s.url).map((s) => s.url);
}

// daftar nama artis dari response GraphQL: [{profile:{name}}]
function artistNames(items) {
  if (!items || !items.length) return [];
  return items
    .map((a) => a && a.profile && a.profile.name)
    .filter(Boolean);
}

function albumDate(dateObj) {
  if (!dateObj) return null;
  if (typeof dateObj.isoString === "string") return dateObj.isoString.slice(0, 10);
  return null;
}

function datePrecision(p) {
  return p ? String(p).toLowerCase() : null;
}

datePrecision = (p) => (p ? String(p).toLowerCase() : null);

// Spotify membalas entitas yang tak ada dengan __typename "NotFound".
function notFound(obj) {
  return !obj || obj.__typename === "NotFound";
}

/* =========================================================================
 * Anonymous token dari halaman embed (cheerio)
 * ======================================================================= */

const TokenManager = {
  token: null,
  expiresAt: 0,
  startIndex: 0,
  pending: null,

  hasValid() {
    return Boolean(this.token && Date.now() < this.expiresAt - 60000);
  },

  async get(force) {
    if (!force && this.hasValid()) return this.token;
    if (this.pending) return this.pending;
    this.pending = this._refresh().finally(() => {
      this.pending = null;
    });
    return this.pending;
  },

  async _refresh() {
    let lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      for (let k = 0; k < TOKEN_SOURCES.length; k++) {
        const idx = (this.startIndex + k) % TOKEN_SOURCES.length;
        const embedPath = TOKEN_SOURCES[idx];
        try {
          const res = await axios.get(EMBED_BASE + embedPath, {
            headers: {
              "User-Agent": UA,
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
            },
            timeout: REQUEST_TIMEOUT,
            responseType: "text",
            maxRedirects: 5,
            validateStatus: null,
          });
          if (res.status !== 200 || typeof res.data !== "string") {
            lastErr = new Error(`${embedPath} -> HTTP ${res.status}`);
            continue;
          }
          const $ = cheerio.load(res.data);
          const raw = $("#__NEXT_DATA__").html();
          if (!raw) {
            lastErr = new Error(`${embedPath} -> __NEXT_DATA__ tidak ditemukan`);
            continue;
          }
          const nextData = JSON.parse(raw);
          const state = nextData.props && nextData.props.pageProps && nextData.props.pageProps.state;
          const session = state && state.settings && state.settings.session;
          if (!session || !session.accessToken) {
            lastErr = new Error(`${embedPath} -> access token tidak ada di embed`);
            continue;
          }
          this.token = session.accessToken;
          this.expiresAt =
            typeof session.accessTokenExpirationTimestampMs === "number"
              ? session.accessTokenExpirationTimestampMs
              : Date.now() + 3600000;
          this.startIndex = idx;
          log(`token anonim didapat dari ${embedPath} (expiry ${Math.round((this.expiresAt - Date.now()) / 60000)}m)`);
          return this.token;
        } catch (err) {
          lastErr = err;
          await sleep(1000 * attempt);
        }
      }
    }
    throw new Error(
      "gagal mengambil token anonim Spotify" +
        (lastErr ? `: ${lastErr.message}` : "") +
        ". Periksa koneksi internet / ketersediaan open.spotify.com."
    );
  },
};

/* =========================================================================
 * HTTP wrapper + retry
 * ======================================================================= */

async function httpGet(url, headers, params) {
  return axios.get(url, {
    headers: { "User-Agent": UA, ...headers },
    params,
    timeout: REQUEST_TIMEOUT,
    responseType: "json",
    validateStatus: null,
  });
}

const NET_RETRY_CODE = /ECONNABORTED|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/;

/**
 * Query GraphQL persisted ke api-partner (web player). Otomatis:
 *  - retry koneksi/timeout/5xx (maks 4 percobaan)
 *  - backoff saat 429 (rate limit)
 *  - refresh token saat 401/403
 * Mengembalikan objek `data` dari response.
 */
async function pathfinderQuery(operationName, variables, attempts = 4) {
  const q = QUERIES[operationName];
  if (!q) throw new Error(`operasi tidak dikenal: ${operationName}`);

  const params = {
    operationName,
    variables: JSON.stringify(variables),
    extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: q.hash } }),
  };
  const headers = { Authorization: "Bearer X", "Accept-Language": "en-US,en;q=0.9" };

  let token = await TokenManager.get();
  let lastErr = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) await sleep(Math.min(attempt * 1500, 6000));
    headers.Authorization = `Bearer ${token}`;
    try {
      const res = await httpGet(PATHFINDER, headers, params);

      if (res.status === 200) {
        const body = res.data && typeof res.data === "object" ? res.data : null;
        if (body && body.errors && !body.data) {
          throw new Error(`pathfinder "${operationName}": ${body.errors.map((e) => e.message).join("; ")}`);
        }
        if (body && body.errors && body.data) {
          log(`peringatan "${operationName}": ${body.errors.map((e) => e.message).slice(0, 2).join("; ")}`);
        }
        return body ? body.data : null;
      }

      if (res.status === 401 || res.status === 403) {
        lastErr = new Error(`HTTP ${res.status}`);
        token = await TokenManager.get(true);
        continue;
      }
      if (res.status === 429) {
        lastErr = new Error("HTTP 429 rate limit");
        await sleep(3000 * attempt);
        continue;
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (e.message && e.message.startsWith("pathfinder ")) throw e;
      const status = e.response && e.response.status;
      const netCode = (e.code || "") + "";
      if (status === 401 || status === 403) {
        token = await TokenManager.get(true);
        lastErr = e;
        continue;
      }
      if (status === 429) {
        lastErr = e;
        await sleep(3000 * attempt);
        continue;
      }
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (NET_RETRY_CODE.test(netCode) || netCode === "" || status === undefined) {
        log(`gangguan jaringan (${netCode || e.message}), percobaan ${attempt}...`);
        continue;
      }
    }
  }
  throw new Error(
    `permintaan "${operationName}" gagal setelah ${attempts} percobaan` +
      (lastErr ? `: ${lastErr.message}` : "")
  );
}

/* =========================================================================
 * Pencarian (dengan pagination)
 * ======================================================================= */

const SEARCH_OPS = {
  track: { op: "searchTracks", prop: "tracksV2" },
  artist: { op: "searchArtists", prop: "artists" },
  album: { op: "searchAlbums", prop: "albumsV2" },
  playlist: { op: "searchPlaylists", prop: "playlists" },
};

async function searchType(type, searchTerm, limit) {
  const { op, prop } = SEARCH_OPS[type];
  const items = [];
  let totalCount = null;
  let offset = 0;

  while (items.length < limit) {
    const pageSize = Math.min(PAGE_LIMIT, limit - items.length);
    const data = await pathfinderQuery(op, { searchTerm, offset, limit: pageSize });
    const section = data && data.searchV2 && data.searchV2[prop];
    const pageItems = (section && section.items) || [];
    if (typeof (section && section.totalCount) === "number") totalCount = section.totalCount;
    if (!pageItems.length) break;
    for (const it of pageItems) {
      if (items.length < limit) items.push(it);
    }
    offset += pageItems.length;
    if (typeof totalCount === "number" && offset >= totalCount) break;
    if (pageItems.length < pageSize) break;
    await sleep(200);
  }
  return { items, totalCount };
}

/* =========================================================================
 * Pengayaan entitas (enrichment)
 * ======================================================================= */

// Hasil pencarian berbeda nesting per tipe:
//   track:    item.item.data   (TrackResponseWrapper bertingkat)
//   lainnya:  item.data
function searchDataOf(item) {
  if (!item || typeof item !== "object") return {};
  if (item.data && item.data.__typename) return item.data;
  if (item.item && item.item.data && item.item.data.__typename) return item.item.data;
  return item.data || (item.item && item.item.data) || item;
}

// Track dari hasil pencarian; diperkaya dari detail albumnya.
async function enrichTrackFromSearch(item) {
  const d = searchDataOf(item);
  const id = d.id || uriToId(d.uri);
  const album = d.albumOfTrack || (d.album && d.album.data) || {};
  const uri = d.uri || (id ? `spotify:track:${id}` : null);

  const meta = {
    title: d.name || null,
    artist: artistNames(d.artists && d.artists.items).join(", ") || null,
    album: album.name || null,
    album_type: null,
    cover_url: bestImage(album.coverArt && album.coverArt.sources),
    duration_ms: (d.duration && d.duration.totalMilliseconds) || null,
    release_date: null,
    track_number: null,
    disc_number: null,
    track_id: id || null,
    track_url: entityUrl("track", id),
  };

  if (meta.duration_ms == null) {
    meta.duration_ms = (d.trackDuration && d.trackDuration.totalMilliseconds) || null;
  }

  const albumUri = album.uri || (album.id ? `spotify:album:${album.id}` : null);
  if (albumUri) {
    try {
      const data = await pathfinderQuery("getAlbum", { uri: albumUri, offset: 0, limit: PAGE_LIMIT });
      const a = data && data.albumUnion;
      if (a) {
        meta.album_type = a.type || meta.album_type;
        meta.release_date = albumDate(a.date);
        meta.cover_url = meta.cover_url || bestImage(a.coverArt && a.coverArt.sources);
        const own = ((a.tracksV2 && a.tracksV2.items) || [])
          .map((t) => t && t.track)
          .find((t) => t && (t.uri === uri || uriToId(t.uri) === id));
        if (own) {
          meta.track_number = own.trackNumber != null ? own.trackNumber : null;
          meta.disc_number = own.discNumber != null ? own.discNumber : null;
          if (meta.duration_ms == null) {
            meta.duration_ms = (own.duration && own.duration.totalMilliseconds) || null;
          }
        }
      }
    } catch (e) {
      log(`track ${id}: pengayaan album gagal (${e.message})`);
    }
  }
  return meta;
}

// Track langsung via URI/URL: getTrack memberi album uri + penomoran, lalu
// detail disc_number/tanggal rilis diperkaya dari getAlbum.
async function enrichTrackDirect(id) {
  const uri = `spotify:track:${id}`;
  const data = await pathfinderQuery("getTrack", { uri });
  const t = data && data.trackUnion;
  if (notFound(t)) throw new Error(`track ${id} tidak ditemukan / tidak tersedia`);

  const names = [];
  const collect = (grp) => {
    for (const a of (grp && grp.items) || []) {
      const n = a && a.profile && a.profile.name;
      if (n && !names.includes(n)) names.push(n);
    }
  };
  collect(t.firstArtist);
  collect(t.otherArtists);
  const al = t.albumOfTrack || {};

  const meta = {
    title: t.name || null,
    artist: names.join(", ") || null,
    album: al.name || null,
    album_type: al.type || null,
    cover_url: bestImage(al.coverArt && al.coverArt.sources),
    duration_ms: (t.duration && t.duration.totalMilliseconds) || null,
    release_date: albumDate(al.date),
    track_number: t.trackNumber != null ? t.trackNumber : null,
    disc_number: null,
    track_id: uriToId(t.uri) || id,
    track_url: entityUrl("track", uriToId(t.uri) || id),
  };

  const albumUri = al.uri;
  if (albumUri) {
    try {
      const data2 = await pathfinderQuery("getAlbum", { uri: albumUri, offset: 0, limit: PAGE_LIMIT });
      const a = data2 && data2.albumUnion;
      if (notFound(a)) throw new Error("detail album tidak ditemukan");
      if (a) {
        meta.album_type = a.type || meta.album_type;
        meta.release_date = albumDate(a.date) || meta.release_date;
        meta.cover_url = meta.cover_url || bestImage(a.coverArt && a.coverArt.sources);
        const own = ((a.tracksV2 && a.tracksV2.items) || [])
          .map((x) => x && x.track)
          .find((x) => x && x.uri === uri);
        if (own) {
          meta.disc_number = own.discNumber != null ? own.discNumber : null;
          meta.track_number = own.trackNumber != null ? own.trackNumber : meta.track_number;
          if (meta.duration_ms == null) {
            meta.duration_ms = (own.duration && own.duration.totalMilliseconds) || null;
          }
        }
      }
    } catch (e) {
      log(`track ${id}: pengayaan album gagal (${e.message})`);
    }
  }
  return meta;
}

async function enrichArtistFromSearch(item) {
  const d = searchDataOf(item);
  const id = uriToId(d.uri) || d.id || null;
  const avatarImage = (d.visuals && d.visuals.avatarImage && d.visuals.avatarImage.sources) || [];

  const meta = {
    artist_name: (d.profile && d.profile.name) || null,
    artist_id: id,
    artist_url: entityUrl("artist", id),
    artist_images: [],
    genres: [],
    followers: null,
    popularity: null,
  };

  if (uriExists(d.uri)) {
    try {
      const data = await pathfinderQuery("queryArtistOverview", { uri: d.uri });
      const a = data && data.artistUnion;
      if (notFound(a)) throw new Error("artis tidak ditemukan");
      if (a) {
        if (a.profile && a.profile.name) {
          meta.artist_name = meta.artist_name || a.profile.name;
        }
        const urls = [];
        for (const u of imageUrls(avatarImage)) urls.push(u);
        for (const u of imageUrls(a.visuals && a.visuals.avatarImage && a.visuals.avatarImage.sources)) {
          if (!urls.includes(u)) urls.push(u);
        }
        for (const u of imageUrls(a.headerImage && a.headerImage.sources)) {
          if (!urls.includes(u)) urls.push(u);
        }
        meta.artist_images = urls;
        const st = a.stats || {};
        if (typeof st.followers === "number") meta.followers = st.followers;
        else if (typeof st.followerCount === "number") meta.followers = st.followerCount;
      }
    } catch (e) {
      log(`artist ${id}: pengayaan gagal (${e.message})`);
      if (meta.artist_name == null) throw e;
    }
  }
  if (!meta.artist_images.length) meta.artist_images = imageUrls(avatarImage);
  return meta;
}

function uriExists(x) {
  return typeof x === "string" && x.includes("spotify:");
}

async function enrichAlbumFromSearch(item) {
  const d = searchDataOf(item);
  const id = uriToId(d.uri) || d.id || null;

  const meta = {
    album_name: d.name || null,
    album_id: id,
    album_type: d.type || null,
    album_url: entityUrl("album", id),
    cover_url: bestImage(d.coverArt && d.coverArt.sources),
    release_date: null,
    release_date_precision: null,
    total_tracks: null,
    artist: artistNames(d.artists && d.artists.items).join(", ") || null,
  };
  if (d.date && typeof d.date.year === "number") {
    meta.release_date = String(d.date.year);
    meta.release_date_precision = "year";
  }

  if (uriExists(d.uri)) {
    try {
      const data = await pathfinderQuery("getAlbum", { uri: d.uri, offset: 0, limit: PAGE_LIMIT });
      const a = data && data.albumUnion;
      if (notFound(a)) throw new Error("album tidak ditemukan di Spotify");
      if (a) {
        meta.album_type = a.type || meta.album_type;
        const iso = albumDate(a.date);
        if (iso) {
          meta.release_date = iso;
          meta.release_date_precision = datePrecision(a.date.precision);
        }
        meta.total_tracks = (a.tracksV2 && a.tracksV2.totalCount) || meta.total_tracks;
        meta.cover_url = meta.cover_url || bestImage(a.coverArt && a.coverArt.sources);
        const names = artistNames(a.artists && a.artists.items);
        if (names.length) meta.artist = names.join(", ");
      }
    } catch (e) {
      log(`album ${id}: pengayaan gagal (${e.message})`);
      if (meta.album_name == null) throw e;
    }
  }
  return meta;
}

async function enrichPlaylistFromSearch(item) {
  const d = (item && (item.data || item)) || {};
  const id = uriToId(d.uri) || d.id || null;
  const images =
    (d.images && d.images.fallback && d.images.fallback.sources) ||
    (d.images && d.images.items && d.images.items[0] && d.images.items[0].sources) ||
    [];

  const meta = {
    playlist_name: d.name || null,
    playlist_id: id,
    playlist_url: entityUrl("playlist", id),
    description: d.description || null,
    cover_images: [],
    owner: null,
    tracks: [],
    total_tracks: null,
  };

  if (d.ownerV2 && d.ownerV2.data && d.ownerV2.data.name) {
    meta.owner = d.ownerV2.data.name;
  } else {
    const attrUri = (d.attributes || []).find((a) => a && a.key === "uri");
    const m = attrUri && attrUri.value && attrUri.value.match(/spotify:user:([^:]+):/);
    if (m) meta.owner = m[1];
  }

  if (uriExists(d.uri)) {
    // Metadata detail: owner resmi, total track, gambar.
    try {
      const data = await pathfinderQuery("fetchPlaylistMetadata", {
        uri: d.uri,
        enableWatchFeedEntrypoint: true,
      });
      const p = data && data.playlistV2;
      if (notFound(p)) throw new Error("playlist tidak ditemukan di Spotify");
      if (p) {
        meta.description = p.description || meta.description;
        if ((p.content && p.content.totalCount) != null) meta.total_tracks = p.content.totalCount;
        if (p.ownerV2 && p.ownerV2.data && p.ownerV2.data.name) meta.owner = p.ownerV2.data.name;
        const ovImages =
          (p.images && p.images.fallback && p.images.fallback.sources) ||
          (p.images && p.images.items && p.images.items[0] && p.images.items[0].sources) ||
          [];
        if (ovImages.length) meta.cover_images = imageUrls(ovImages);
      }
    } catch (e) {
      log(`playlist ${id}: metadata gagal (${e.message})`);
      if (meta.playlist_name == null) throw e;
    }

    // Daftar track (pagination penuh).
    try {
      const seen = new Set();
      let offset = 0;
      let guard = 0;
      while (guard++ < 12) {
        if (meta.total_tracks != null && meta.tracks.length >= meta.total_tracks) break;
        if (meta.tracks.length >= MAX_PLAYLIST_TRACKS) break;
        const data = await pathfinderQuery("fetchPlaylistContents", {
          uri: d.uri,
          offset,
          limit: PAGE_LIMIT,
          enableWatchFeedEntrypoint: true,
        });
        const c = data && data.playlistV2 && data.playlistV2.content;
        const pageItems = (c && c.items) || [];
        if (!pageItems.length) break;
        const before = meta.tracks.length;
        for (const it of pageItems) {
          const t = it && it.itemV2 && it.itemV2.data;
          if (!t || t.__typename !== "Track" || seen.has(t.uri)) continue;
          seen.add(t.uri);
          const al = t.albumOfTrack || {};
          meta.tracks.push({
            title: t.name || null,
            artist:
              artistNames((al.artists && al.artists.items) || (t.artists && t.artists.items) || []).join(", ") ||
              null,
            album: al.name || null,
            cover_url: bestImage(al.coverArt && al.coverArt.sources),
            duration_ms:
              (t.trackDuration && t.trackDuration.totalMilliseconds) ||
              (t.duration && t.duration.totalMilliseconds) ||
              null,
            track_id: uriToId(t.uri) || null,
            track_url: entityUrl("track", uriToId(t.uri)),
          });
        }
        if (meta.tracks.length === before) break;
        const paging = c && c.pagingInfo;
        if (!paging || typeof paging.offset !== "number" || paging.offset <= offset) break;
        offset = paging.offset;
        await sleep(150);
      }
      if (meta.total_tracks == null) meta.total_tracks = meta.tracks.length;
      if (!meta.cover_images.length) meta.cover_images = imageUrls(images);
    } catch (e) {
      log(`playlist ${id}: daftar track gagal (${e.message})`);
    }
  }
  return meta;
}

/* =========================================================================
 * Target langsung (URI / URL Spotify)
 * ======================================================================= */

function parseTargetUriOrUrl(str) {
  if (typeof str !== "string") return null;
  const m =
    str.match(/spotify:(track|album|artist|playlist):([A-Za-z0-9]+)/) ||
    str.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|artist|playlist)\/([A-Za-z0-9]+)/);
  if (m) return { type: m[1], id: m[2] };
  return null;
}

/* =========================================================================
 * Output & CLI
 * ======================================================================= */

function parseArgs(argv) {
  const args = { query: null, limit: DEFAULT_LIMIT, type: "all", save: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit" || a === "-l") {
      const v = a.includes("=") ? a.split("=")[1] : argv[++i];
      const n = parseInt(v, 10);
      if (!isNaN(n) && n > 0) args.limit = Math.min(n, 100);
    } else if (a.startsWith("--type")) {
      const v = a.includes("=") ? a.split("=")[1] : argv[++i];
      if (["track", "artist", "album", "playlist", "all"].includes(v)) args.type = v;
    } else if (a.startsWith("--save")) {
      args.save = a.includes("=") ? a.split("=")[1] : argv[++i];
    } else if (a === "--help" || a === "-h") {
      args.help = true;
    } else if (!args.query) {
      args.query = a;
    }
  }
  return args;
}

function usage() {
  console.log(
    [
      "Spotify metadata scraper (open.spotify.com) - axios + cheerio, tanpa browser.",
      "",
      "Pemakaian:",
      '  node scrape-spotify.js "kata kunci" [--type track|artist|album|playlist|all] [--limit N] [--save file.json]',
      "  node scrape-spotify.js \"<spotify uri/url>\"          # target langsung",
      "",
      "Contoh:",
      '  node scrape-spotify.js "Blinding Lights"',
      '  node scrape-spotify.js "The Weeknd" --type artist',
      '  node scrape-spotify.js "https://open.spotify.com/album/4yP0hdKOZPNshxUOjY0cZj"',
      "",
      "Catatan:",
      "  - artist.popularity: Spotify tidak mengekspos angka 0-100 di open.spotify.com, nilainya null.",
      "  - artist.genres     : genrenya tidak tersedia di data publik web player, berupa array kosong.",
      "",
    ].join("\n")
  );
}

function printResult(out, args) {
  const json = JSON.stringify(out, null, 2);
  if (args.save) {
    const file = path.resolve(args.save);
    fs.writeFileSync(file, json + "\n");
    log(`hasil disimpan: ${file}`);
  }
  console.log(json);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.query) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const out = {
    query: args.query,
    source: "open.spotify.com",
    generated_at: new Date().toISOString(),
    tracks: [],
    artists: [],
    albums: [],
    playlists: [],
  };

  try {
    const direct = parseTargetUriOrUrl(args.query);
    if (direct) {
      log(`mode langsung: ${direct.type} ${direct.id}`);
      if (direct.type === "track") out.tracks.push(await enrichTrackDirect(direct.id));
      else if (direct.type === "artist") {
        out.artists.push(await enrichArtistFromSearch({ data: { uri: `spotify:artist:${direct.id}` } }));
      } else if (direct.type === "album") {
        out.albums.push(await enrichAlbumFromSearch({ data: { uri: `spotify:album:${direct.id}` } }));
      } else if (direct.type === "playlist") {
        out.playlists.push(await enrichPlaylistFromSearch({ data: { uri: `spotify:playlist:${direct.id}` } }));
      }
    } else {
      const types = args.type === "all" ? ["track", "artist", "album", "playlist"] : [args.type];
      for (const type of types) {
        log(`mencari ${type}: "${args.query}" (limit ${args.limit})`);
        const res = await searchType(type, args.query, args.limit);
        log(`${res.items.length}/${res.totalCount == null ? "?" : res.totalCount} ${type} ditemukan`);
        for (const item of res.items) {
          try {
            if (type === "track") out.tracks.push(await enrichTrackFromSearch(item));
            else if (type === "artist") out.artists.push(await enrichArtistFromSearch(item));
            else if (type === "album") out.albums.push(await enrichAlbumFromSearch(item));
            else out.playlists.push(await enrichPlaylistFromSearch(item));
          } catch (e) {
            log(`${type}: salah satu item gagal (${e.message})`);
          }
          await sleep(250);
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    process.stderr.write(`\nERROR: ${msg}\n`);
    if (hasData(out)) {
      process.stderr.write("(sebagian data berhasil diambil, keluar kode 2)\n");
      printResult(out, args);
      process.exit(2);
    }
    process.exit(1);
  }

  if (!hasData(out)) {
    log(`tidak ada hasil untuk "${args.query}"`);
  }
  printResult(out, args);
}

function hasData(out) {
  return out.tracks.length || out.artists.length || out.albums.length || out.playlists.length;
}

process.on("unhandledRejection", (e) => {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`\nFATAL: ${msg}\n`);
  process.exit(1);
});

main();
