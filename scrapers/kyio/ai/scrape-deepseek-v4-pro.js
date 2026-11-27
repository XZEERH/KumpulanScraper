#!/usr/bin/env node
'use strict';

/**
 * Name : DeepSeek V4 Pro AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : DeepSeek V4 Pro cutting-edge long-context reasoning and coding architecture with 1M context window.
 * Note : node scrapers/kyio/ai/scrape-deepseek-v4-pro.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/deepseek-v4-pro';
const { scrape: aiDeepseekV4Pro, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiDeepseekV4Pro };
if (require.main === module) cli();
