#!/usr/bin/env node
'use strict';

/**
 * Name : FactSlides
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get random interesting facts from FactSlides
 * Note : node scrapers/kyio/fun/scrape-factslides.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/fun/factslides';
const { scrape: funFactslides, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { funFactslides };
if (require.main === module) cli();
