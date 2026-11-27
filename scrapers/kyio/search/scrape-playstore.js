#!/usr/bin/env node
'use strict';

/**
 * Name : PlayStore Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search apps on Google PlayStore.
 * Note : node scrapers/kyio/search/scrape-playstore.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/playstore';
const { scrape: searchPlaystore, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchPlaystore };
if (require.main === module) cli();
