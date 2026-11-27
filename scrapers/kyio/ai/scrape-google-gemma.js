#!/usr/bin/env node
'use strict';

/**
 * Name : Gemma AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Google DeepMind Gemma AI dengan dukungan sesi chat.
 * Note : node scrapers/kyio/ai/scrape-google-gemma.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/google-gemma';
const { scrape: aiGoogleGemma, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    sessionId: {}
  }
});

module.exports = { aiGoogleGemma };
if (require.main === module) cli();
