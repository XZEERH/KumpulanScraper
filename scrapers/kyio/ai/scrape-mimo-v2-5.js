#!/usr/bin/env node
'use strict';

/**
 * Name : Xiaomi MiMo v2.5 AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fast Xiaomi MiMo-v2.5 LLM chat model.
 * Note : node scrapers/kyio/ai/scrape-mimo-v2-5.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/mimo-v2-5';
const { scrape: aiMimoV25, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiMimoV25 };
if (require.main === module) cli();
