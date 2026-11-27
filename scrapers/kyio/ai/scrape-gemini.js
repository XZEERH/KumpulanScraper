#!/usr/bin/env node
'use strict';

/**
 * Name : Google Gemini
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Google Gemini conversational AI model.
 * Note : node scrapers/kyio/ai/scrape-gemini.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gemini';
const { scrape: aiGemini, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiGemini };
if (require.main === module) cli();
