#!/usr/bin/env node
'use strict';

/**
 * Name : CNN Indonesia News
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch the latest news articles from CNN Indonesia
 * Note : node scrapers/kyio/news/scrape-cnn.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/cnn';
const { scrape: newsCnn, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsCnn };
if (require.main === module) cli();
