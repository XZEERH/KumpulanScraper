#!/usr/bin/env node
'use strict';

/**
 * Name : Dreamy AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Chat with AI characters from Dreemy.ai.
 * Note : node scrapers/kyio/ai/scrape-dreemy.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/dreemy';
const { scrape: aiDreemy, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    botId: { required: true }
  }
});

module.exports = { aiDreemy };
if (require.main === module) cli();
