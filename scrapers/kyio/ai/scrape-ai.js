#!/usr/bin/env node
'use strict';

/**
 * Name : AI Chat & Vision
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : AI Chat dengan dukungan Text & Vision.
 * Note : node scrapers/kyio/ai/scrape-ai.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/ai';
const { scrape: aiAi, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    sessionId: {},
    url: {}
  }
});

module.exports = { aiAi };
if (require.main === module) cli();
