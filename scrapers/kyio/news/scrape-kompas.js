#!/usr/bin/env node
'use strict';

/**
 * Name : Kompas.com News
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch the latest news articles from Kompas.com
 * Note : node scrapers/kyio/news/scrape-kompas.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/kompas';
const { scrape: newsKompas, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsKompas };
if (require.main === module) cli();
