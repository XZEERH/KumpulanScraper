#!/usr/bin/env node
'use strict';

/**
 * Name : Temp Mail Generator V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate temporary email addresses and check inbox (action=create | action=inbox&email=xxx).
 * Note : node scrapers/kyio/tools/scrape-tempmail-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/tempmail-v2';
const { scrape: toolsTempmailV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: { required: true },
    email: {}
  }
});

module.exports = { toolsTempmailV2 };
if (require.main === module) cli();
