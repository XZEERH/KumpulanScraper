#!/usr/bin/env node
'use strict';

/**
 * Name : Google Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search the web using high-performance Google Search engine.
 * Note : node scrapers/kyio/search/scrape-google.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/google';
const { scrape: searchGoogle, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchGoogle };
if (require.main === module) cli();
