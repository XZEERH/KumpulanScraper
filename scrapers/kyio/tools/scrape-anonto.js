#!/usr/bin/env node
'use strict';

/**
 * Name : Anon.to Shortener
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Anonymize and shorten URLs using Anon.to service
 * Note : node scrapers/kyio/tools/scrape-anonto.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/anonto';
const { scrape: toolsAnonto, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { toolsAnonto };
if (require.main === module) cli();
