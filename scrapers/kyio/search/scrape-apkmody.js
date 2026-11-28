#!/usr/bin/env node
'use strict';

/**
 * Name : App Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Discover modified and original Android applications from the APKMody repository.
 * Note : node scrapers/kyio/search/scrape-apkmody.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/apkmody';
const { scrape: searchApkmody, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchApkmody };
if (require.main === module) cli();
