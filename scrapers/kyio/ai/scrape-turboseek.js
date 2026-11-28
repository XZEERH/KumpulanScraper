#!/usr/bin/env node
'use strict';

/**
 * Name : Turboseek AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : AI-powered search engine that provides answers with real-time sources and web citations.
 * Note : node scrapers/kyio/ai/scrape-turboseek.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/turboseek';
const { scrape: aiTurboseek, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiTurboseek };
if (require.main === module) cli();
