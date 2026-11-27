#!/usr/bin/env node
'use strict';

/**
 * Name : Lyrics & Synced LRC Search V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for song lyrics from LRCLib. Supports Spotify URLs, plain text, and synced lyrics (LRC).
 * Note : node scrapers/kyio/search/scrape-lyrics-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/lyrics-v2';
const { scrape: searchLyricsV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    artist: {}
  }
});

module.exports = { searchLyricsV2 };
if (require.main === module) cli();
