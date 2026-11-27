#!/usr/bin/env node
'use strict';

/**
 * Name : Bom.so Shortener
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Shorten URLs using the bom.so service
 * Note : node scrapers/kyio/tools/scrape-bomso.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/bomso';
const { scrape: toolsBomso, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { toolsBomso };
if (require.main === module) cli();
