#!/usr/bin/env node
'use strict';

/**
 * Name : Laguna XS Reasoning AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-speed reasoning and software architecture model powered by Poolside Laguna XS.
 * Note : node scrapers/kyio/ai/scrape-laguna.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/laguna';
const { scrape: aiLaguna, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiLaguna };
if (require.main === module) cli();
