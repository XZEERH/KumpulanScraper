#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for TikTok videos by keywords.
 * Note : node scrapers/kyio/search/scrape-tiktok.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/tiktok';
const { scrape: searchTiktok, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchTiktok };
if (require.main === module) cli();
