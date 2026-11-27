#!/usr/bin/env node
'use strict';

/**
 * Name : MangaDex Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for manga and comics with detailed metadata from MangaDex.
 * Note : node scrapers/kyio/search/scrape-mangadex.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/mangadex';
const { scrape: searchMangadex, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchMangadex };
if (require.main === module) cli();
