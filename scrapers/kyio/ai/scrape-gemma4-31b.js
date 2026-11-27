#!/usr/bin/env node
'use strict';

/**
 * Name : Gemma 4 31B AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Google Gemma 4 31B open-weights model served privately through Duck.ai Tinfoil.
 * Note : node scrapers/kyio/ai/scrape-gemma4-31b.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gemma4-31b';
const { scrape: aiGemma431b, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiGemma431b };
if (require.main === module) cli();
