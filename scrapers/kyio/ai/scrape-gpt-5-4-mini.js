#!/usr/bin/env node
'use strict';

/**
 * Name : GPT-5.4 Mini AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : OpenAI GPT-5.4 Mini lightweight high-speed conversational model melalui Duck.ai.
 * Note : node scrapers/kyio/ai/scrape-gpt-5-4-mini.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gpt-5-4-mini';
const { scrape: aiGpt54Mini, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiGpt54Mini };
if (require.main === module) cli();
