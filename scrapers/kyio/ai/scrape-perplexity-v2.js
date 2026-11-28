#!/usr/bin/env node
'use strict';

/**
 * Name : Perplexity AI V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-performance web search and answers engine (Version 2).
 * Note : node scrapers/kyio/ai/scrape-perplexity-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/perplexity-v2';
const { scrape: aiPerplexityV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiPerplexityV2 };
if (require.main === module) cli();
