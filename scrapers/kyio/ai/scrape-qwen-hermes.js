#!/usr/bin/env node
'use strict';

/**
 * Name : Qwen 3.6 27B Hermes
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-speed Qwen 3.6 27B Int4 model hosted on Hermes vLLM engine.
 * Note : node scrapers/kyio/ai/scrape-qwen-hermes.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/qwen-hermes';
const { scrape: aiQwenHermes, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiQwenHermes };
if (require.main === module) cli();
