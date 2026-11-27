#!/usr/bin/env node
'use strict';

/**
 * Name : ChatAI Multi-Model
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Multi-model AI chat supporting ChatGPT, Claude, Gemini, Grok, DeepSeek.
 * Note : node scrapers/kyio/ai/scrape-chatai.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/chatai';
const { scrape: aiChatai, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiChatai };
if (require.main === module) cli();
