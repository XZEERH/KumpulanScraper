#!/usr/bin/env node
'use strict';

/**
 * Name : Acode Plugin Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search and get details for Acode Editor plugins.
 * Note : node scrapers/kyio/search/scrape-acode.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/acode';
const { scrape: searchAcode, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    id: { required: true },
    action: { required: true }
  }
});

module.exports = { searchAcode };
if (require.main === module) cli();
