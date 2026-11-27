#!/usr/bin/env node
'use strict';

/**
 * Name : Giphy/Tenor Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for animated GIFs and obtain direct links
 * Note : node scrapers/kyio/fun/scrape-giphy.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/fun/giphy';
const { scrape: funGiphy, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { funGiphy };
if (require.main === module) cli();
