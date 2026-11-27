#!/usr/bin/env node
'use strict';

/**
 * Name : GPT-5.6 Sol AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : OpenAI GPT-5.6 Sol premium conversational model melalui Duck.ai.
 * Note : node scrapers/kyio/ai/scrape-gpt-5-6-sol.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gpt-5-6-sol';
const { scrape: aiGpt56Sol, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiGpt56Sol };
if (require.main === module) cli();
