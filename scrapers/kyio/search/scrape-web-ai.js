#!/usr/bin/env node
'use strict';

/**
 * Name : Real-time AI Web Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Real-time AI Web Search
 * Note : node scrapers/kyio/search/scrape-web-ai.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/web-ai';
const { scrape: searchWebAi, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchWebAi };
if (require.main === module) cli();
