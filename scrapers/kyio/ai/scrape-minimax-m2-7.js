#!/usr/bin/env node
'use strict';

/**
 * Name : MiniMax M2.7 AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-speed bilingual reasoning and conversational model developed by MiniMax.
 * Note : node scrapers/kyio/ai/scrape-minimax-m2-7.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/minimax-m2-7';
const { scrape: aiMinimaxM27, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiMinimaxM27 };
if (require.main === module) cli();
