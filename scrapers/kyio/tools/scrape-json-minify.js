#!/usr/bin/env node
'use strict';

/**
 * Name : JSON Minify
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Minify dan kompres format JSON string.
 * Note : node scrapers/kyio/tools/scrape-json-minify.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/json-minify';
const { scrape: toolsJsonMinify, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    json: { required: true }
  }
});

module.exports = { toolsJsonMinify };
if (require.main === module) cli();
