#!/usr/bin/env node
'use strict';

/**
 * Name : Mistral Small 4 AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Mistral Small 4 (2603) efficient open conversational model melalui Duck.ai.
 * Note : node scrapers/kyio/ai/scrape-mistral-small-2603.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/mistral-small-2603';
const { scrape: aiMistralSmall2603, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiMistralSmall2603 };
if (require.main === module) cli();
