#!/usr/bin/env node
'use strict';

/**
 * Name : Mistral Large 3
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Model penalaran multilingual dan coding flagship dari Mistral AI.
 * Note : node scrapers/kyio/ai/scrape-mistral-large.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/mistral-large';
const { scrape: aiMistralLarge, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiMistralLarge };
if (require.main === module) cli();
