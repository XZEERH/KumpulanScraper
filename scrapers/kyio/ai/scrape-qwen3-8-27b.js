#!/usr/bin/env node
'use strict';

/**
 * Name : Qwen 3.8 27B AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Alibaba Cloud high-performance open-weights LLM with deep multilingual and reasoning capabilities.
 * Note : node scrapers/kyio/ai/scrape-qwen3-8-27b.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/qwen3-8-27b';
const { scrape: aiQwen3827b, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiQwen3827b };
if (require.main === module) cli();
