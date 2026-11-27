#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Playlist Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download full playlist metadata, cover art, and track listings from any Spotify playlist URL.
 * Note : node scrapers/kyio/downloader/scrape-spotify-playlist.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/spotify-playlist';
const { scrape: downloaderSpotifyPlaylist, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    q: {}
  }
});

module.exports = { downloaderSpotifyPlaylist };
if (require.main === module) cli();
