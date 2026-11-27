#!/usr/bin/env node
'use strict';

/**
 * Name : LLMProxy AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Universal high-speed proxy AI engine (deepseek-v4-flash). Mendukung model alias v1 - v5.
 * Note : node scrapers/kyio/ai/scrape-llmproxy.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/llmproxy';
const { scrape: aiLlmproxy, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    model: {}
  }
});

module.exports = { aiLlmproxy };
if (require.main === module) cli();
