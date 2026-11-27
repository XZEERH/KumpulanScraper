#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for high-quality images and pins on Pinterest with full metadata.
 * Note : node scrapers/kyio/search/scrape-pinterest.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/pinterest';
const { scrape: searchPinterest, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    limit: {},
    urls: {}
  }
});

module.exports = { searchPinterest };
if (require.main === module) cli();
