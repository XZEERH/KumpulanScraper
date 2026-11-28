#!/usr/bin/env node
'use strict';

/**
 * Name : Scribd Detail/Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get detailed metadata and download info for Scribd documents or search for them.
 * Note : node scrapers/kyio/search/scrape-scribd.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/scribd';
const { scrape: searchScribd, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchScribd };
if (require.main === module) cli();
