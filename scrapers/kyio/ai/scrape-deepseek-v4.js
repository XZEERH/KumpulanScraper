#!/usr/bin/env node
'use strict';

/**
 * Name : DeepSeek V4
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : DeepSeek-V4 Flash model dengan mode Deep Thinking (Reasoning) untuk analisis mendalam.
 * Note : node scrapers/kyio/ai/scrape-deepseek-v4.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/deepseek-v4';
const { scrape: aiDeepseekV4, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiDeepseekV4 };
if (require.main === module) cli();
