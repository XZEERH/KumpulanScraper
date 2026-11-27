#!/usr/bin/env node
'use strict';

/**
 * Name : Pontianak Post
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch the latest local news from Pontianak Post
 * Note : node scrapers/kyio/news/scrape-pontianakpost.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/news/pontianakpost';
const { scrape: newsPontianakpost, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsPontianakpost };
if (require.main === module) cli();
