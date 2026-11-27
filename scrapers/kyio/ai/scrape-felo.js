#!/usr/bin/env node
'use strict';

/**
 * Name : Felo AI Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Felo AI Search Engine.
 * Note : node scrapers/kyio/ai/scrape-felo.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/felo';
const { scrape: aiFelo, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiFelo };
if (require.main === module) cli();
