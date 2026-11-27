#!/usr/bin/env node
'use strict';

/**
 * Name : AI Chat GPT-3
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : ChatGPT AI conversational assistant.
 * Note : node scrapers/kyio/ai/scrape-gpt3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gpt3';
const { scrape: aiGpt3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiGpt3 };
if (require.main === module) cli();
