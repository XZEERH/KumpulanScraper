#!/usr/bin/env node
'use strict';

/**
 * Name : GPT-5.6 Terra AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : OpenAI GPT-5.6 Terra premium reasoning model melalui Duck.ai.
 * Note : node scrapers/kyio/ai/scrape-gpt-5-6-terra.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gpt-5-6-terra';
const { scrape: aiGpt56Terra, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiGpt56Terra };
if (require.main === module) cli();
