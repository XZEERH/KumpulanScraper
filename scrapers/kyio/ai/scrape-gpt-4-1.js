#!/usr/bin/env node
'use strict';

/**
 * Name : OpenAI GPT-4.1 Flagship
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Akses model flagship terbaru OpenAI GPT-4.1 dengan context window 1M tokens.
 * Note : node scrapers/kyio/ai/scrape-gpt-4-1.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gpt-4-1';
const { scrape: aiGpt41, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {},
    deepThink: {}
  }
});

module.exports = { aiGpt41 };
if (require.main === module) cli();
