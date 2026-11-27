#!/usr/bin/env node
'use strict';

/**
 * Name : Facebook Video Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for public videos on Facebook Watch.
 * Note : node scrapers/kyio/search/scrape-facebook.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/facebook';
const { scrape: searchFacebook, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchFacebook };
if (require.main === module) cli();
