#!/usr/bin/env node
'use strict';

/**
 * Name : MiniMax M3 AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-performance bilingual conversation and reasoning AI model by MiniMax.
 * Note : node scrapers/kyio/ai/scrape-minimax-m3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/minimax-m3';
const { scrape: aiMinimaxM3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiMinimaxM3 };
if (require.main === module) cli();
