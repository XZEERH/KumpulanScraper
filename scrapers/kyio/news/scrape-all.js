#!/usr/bin/env node
'use strict';

/**
 * Name : Aggregated News
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get the latest aggregated news from CNN, Kompas, Antara, and CNBC Indonesia
 * Note : node scrapers/kyio/news/scrape-all.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/news/all';
const { scrape: newsAll, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsAll };
if (require.main === module) cli();
