#!/usr/bin/env node
'use strict';

/**
 * Name : Blue Archive Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari artikel, post, dan guide tentang Blue Archive.
 * Note : node scrapers/kyio/search/scrape-bluearchive-search.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/bluearchive-search';
const { scrape: searchBluearchiveSearch, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchBluearchiveSearch };
if (require.main === module) cli();
