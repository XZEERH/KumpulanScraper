#!/usr/bin/env node
'use strict';

/**
 * Name : FeelBetterBot
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Empathetic AI listener and mental health support chatbot via feelbetterbot.com.
 * Note : node scrapers/kyio/ai/scrape-feelbetterbot.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/feelbetterbot';
const { scrape: aiFeelbetterbot, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiFeelbetterbot };
if (require.main === module) cli();
