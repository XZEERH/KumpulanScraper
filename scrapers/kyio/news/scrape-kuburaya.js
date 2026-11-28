#!/usr/bin/env node
'use strict';

/**
 * Name : Kubu Raya News
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch the latest news articles from Kubu Raya regional portal
 * Note : node scrapers/kyio/news/scrape-kuburaya.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/kuburaya';
const { scrape: newsKuburaya, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsKuburaya };
if (require.main === module) cli();
