#!/usr/bin/env node
'use strict';

/**
 * Name : Llama 3.3 70B AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Meta Llama 3.3 70B Instruct model running on high-speed inference for general reasoning, coding, and chat.
 * Note : node scrapers/kyio/ai/scrape-llama-3-3-70b.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/llama-3-3-70b';
const { scrape: aiLlama3370b, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiLlama3370b };
if (require.main === module) cli();
