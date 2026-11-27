#!/usr/bin/env node
'use strict';

/**
 * Name : Dots 3 Note AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Contextual synthesis, document analysis, and note-taking assistant by Dots Studio.
 * Note : node scrapers/kyio/ai/scrape-dots-ai.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/dots-ai';
const { scrape: aiDotsAi, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiDotsAi };
if (require.main === module) cli();
