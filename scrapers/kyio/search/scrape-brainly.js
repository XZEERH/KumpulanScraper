#!/usr/bin/env node
'use strict';

/**
 * Name : Brainly Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for questions and answers on Brainly Indonesia.
 * Note : node scrapers/kyio/search/scrape-brainly.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/brainly';
const { scrape: searchBrainly, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchBrainly };
if (require.main === module) cli();
