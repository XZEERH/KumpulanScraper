#!/usr/bin/env node
'use strict';

/**
 * Name : Deepseek AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : DeepSeek LLM conversational chat.
 * Note : node scrapers/kyio/ai/scrape-deepseek.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/deepseek';
const { scrape: aiDeepseek, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiDeepseek };
if (require.main === module) cli();
