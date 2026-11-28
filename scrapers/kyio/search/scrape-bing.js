#!/usr/bin/env node
'use strict';

/**
 * Name : Bing Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Pencarian komprehensif Microsoft Bing untuk web organic results, gambar resolusi tinggi, dan visual search.
 * Note : node scrapers/kyio/search/scrape-bing.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/bing';
const { scrape: searchBing, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    type: {},
    count: {},
    lang: {},
    country: {}
  }
});

module.exports = { searchBing };
if (require.main === module) cli();
