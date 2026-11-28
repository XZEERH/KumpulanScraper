#!/usr/bin/env node
'use strict';

/**
 * Name : xAI Grok 4
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Model flagship tanpa sensor dan penuh wawasan terkini dari xAI Grok 4.
 * Note : node scrapers/kyio/ai/scrape-grok-4.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/grok-4';
const { scrape: aiGrok4, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiGrok4 };
if (require.main === module) cli();
