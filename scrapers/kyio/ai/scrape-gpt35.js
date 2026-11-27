#!/usr/bin/env node
'use strict';

/**
 * Name : GPT-3.5 Chat AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : AI chat using GPT-3.5 architecture via Custom Chatbot API.
 * Note : node scrapers/kyio/ai/scrape-gpt35.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gpt35';
const { scrape: aiGpt35, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiGpt35 };
if (require.main === module) cli();
