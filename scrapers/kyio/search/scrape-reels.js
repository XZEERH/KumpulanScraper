#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Reels Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for Instagram Reels using Google Custom Search Engine.
 * Note : node scrapers/kyio/search/scrape-reels.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/reels';
const { scrape: searchReels, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    num: { required: true }
  }
});

module.exports = { searchReels };
if (require.main === module) cli();
