#!/usr/bin/env node
'use strict';

/**
 * Name : MiMo V2.6 Pro AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Xiaomi MiMo V2.6 Pro high-reasoning multimodal intelligence model.
 * Note : node scrapers/kyio/ai/scrape-mimo-v2-6-pro.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/mimo-v2-6-pro';
const { scrape: aiMimoV26Pro, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiMimoV26Pro };
if (require.main === module) cli();
