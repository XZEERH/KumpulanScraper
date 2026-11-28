#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Search V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Advanced Spotify search (tracks, albums, artists, playlists, etc.) using internal web player API.
 * Note : node scrapers/kyio/search/scrape-spotify-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/spotify-v2';
const { scrape: searchSpotifyV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    type: {}
  }
});

module.exports = { searchSpotifyV2 };
if (require.main === module) cli();
