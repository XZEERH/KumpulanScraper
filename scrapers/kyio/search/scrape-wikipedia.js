#!/usr/bin/env node
'use strict';

/**
 * Name : Wikipedia Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari dan dapatkan ringkasan artikel Wikipedia.
 * Note : node scrapers/kyio/search/scrape-wikipedia.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/wikipedia';
const { scrape: searchWikipedia, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchWikipedia };
if (require.main === module) cli();
