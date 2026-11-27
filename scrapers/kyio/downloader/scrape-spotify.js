#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Downloader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download tracks and playlists from Spotify with automatic cookie refresh and retry system.
 * Note : node scrapers/kyio/downloader/scrape-spotify.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/spotify';
const { scrape: downloaderSpotify, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderSpotify };
if (require.main === module) cli();
