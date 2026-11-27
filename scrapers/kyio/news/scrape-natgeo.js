#!/usr/bin/env node
'use strict';

/**
 * Name : National Geographic News
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch the latest news articles from National Geographic Indonesia
 * Note : node scrapers/kyio/news/scrape-natgeo.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/natgeo';
const { scrape: newsNatgeo, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsNatgeo };
if (require.main === module) cli();
