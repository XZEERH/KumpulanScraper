#!/usr/bin/env node
'use strict';

/**
 * Name : Xiaomi MiMo AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Model AI chat cerdas Xiaomi MiMo dengan rotasi device otomatis dan follow-up prompts.
 * Note : node scrapers/kyio/ai/scrape-mimo.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/mimo';
const { scrape: aiMimo, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    model: {},
    system: {}
  }
});

module.exports = { aiMimo };
if (require.main === module) cli();
