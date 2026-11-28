#!/usr/bin/env node
'use strict';

/**
 * Name : News Detail Extraction
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Extract the full article content and metadata from a given news URL
 * Note : node scrapers/kyio/news/scrape-news-detail.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/news-detail';
const { scrape: newsNewsDetail, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { newsNewsDetail };
if (require.main === module) cli();
