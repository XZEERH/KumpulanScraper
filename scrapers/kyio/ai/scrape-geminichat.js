#!/usr/bin/env node
'use strict';

/**
 * Name : Gemini Chat UI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Gemini Chat interface with multi-turn support.
 * Note : node scrapers/kyio/ai/scrape-geminichat.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/geminichat';
const { scrape: aiGeminichat, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiGeminichat };
if (require.main === module) cli();
