#!/usr/bin/env node
'use strict';

/**
 * Name : Felo AI V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Felo AI Realtime Search Engine V2.
 * Note : node scrapers/kyio/ai/scrape-felo-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/felo-v2';
const { scrape: aiFeloV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiFeloV2 };
if (require.main === module) cli();
