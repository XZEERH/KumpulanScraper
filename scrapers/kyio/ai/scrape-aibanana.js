#!/usr/bin/env node
'use strict';

/**
 * Name : AI Banana Text to Image
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate AI images using Banana engine.
 * Note : node scrapers/kyio/ai/scrape-aibanana.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/aibanana';
const { scrape: aiAibanana, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiAibanana };
if (require.main === module) cli();
