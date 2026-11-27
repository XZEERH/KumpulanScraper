#!/usr/bin/env node
'use strict';

/**
 * Name : GSMArena Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search smartphone specs on GSMArena.
 * Note : node scrapers/kyio/search/scrape-gsmarena.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/gsmarena';
const { scrape: searchGsmarena, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchGsmarena };
if (require.main === module) cli();
