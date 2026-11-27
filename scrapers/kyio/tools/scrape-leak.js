#!/usr/bin/env node
'use strict';

/**
 * Name : Leak Check
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Check if your email address has been compromised in known data breaches
 * Note : node scrapers/kyio/tools/scrape-leak.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/leak';
const { scrape: toolsLeak, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    email: { required: true }
  }
});

module.exports = { toolsLeak };
if (require.main === module) cli();
