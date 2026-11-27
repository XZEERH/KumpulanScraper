#!/usr/bin/env node
'use strict';

/**
 * Name : CNBC Indonesia News
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch the latest news articles from CNBC Indonesia
 * Note : node scrapers/kyio/news/scrape-cnbc.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/cnbc';
const { scrape: newsCnbc, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsCnbc };
if (require.main === module) cli();
