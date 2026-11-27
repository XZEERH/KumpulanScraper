#!/usr/bin/env node
'use strict';

/**
 * Name : Xiaomi MiMo v2.5 Pro AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-performance Xiaomi MiMo-v2.5-pro LLM model.
 * Note : node scrapers/kyio/ai/scrape-mimo-v2-5-pro.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/mimo-v2-5-pro';
const { scrape: aiMimoV25Pro, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiMimoV25Pro };
if (require.main === module) cli();
