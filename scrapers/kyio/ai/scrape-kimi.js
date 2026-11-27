#!/usr/bin/env node
'use strict';

/**
 * Name : Kimi AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Kimi AI high-reasoning conversational assistant.
 * Note : node scrapers/kyio/ai/scrape-kimi.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/kimi';
const { scrape: aiKimi, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiKimi };
if (require.main === module) cli();
