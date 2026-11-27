#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Search V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-performance search engine for discovering YouTube content with optimized filtering.
 * Note : node scrapers/kyio/search/scrape-yt-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/yt-v2';
const { scrape: searchYtV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchYtV2 };
if (require.main === module) cli();
