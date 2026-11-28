#!/usr/bin/env node
'use strict';

/**
 * Name : Lyrics Search V1
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for song lyrics from lirik.web.id.
 * Note : node scrapers/kyio/search/scrape-lyrics.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/lyrics';
const { scrape: searchLyrics, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchLyrics };
if (require.main === module) cli();
