#!/usr/bin/env node
'use strict';

/**
 * Name : OpenAI GPT-5 Flagship
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Akses model flagship generasi terbaru OpenAI GPT-5 dengan reasoning ultra-cepat dan pemahaman konteks mendalam.
 * Note : node scrapers/kyio/ai/scrape-gpt-5.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gpt-5';
const { scrape: aiGpt5, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiGpt5 };
if (require.main === module) cli();
