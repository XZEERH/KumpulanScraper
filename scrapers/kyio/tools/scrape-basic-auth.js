#!/usr/bin/env node
'use strict';

/**
 * Name : Basic Auth Generator
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate HTTP Basic Auth header
 * Note : node scrapers/kyio/tools/scrape-basic-auth.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/basic-auth';
const { scrape: toolsBasicAuth, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    username: { required: true },
    password: { required: true }
  }
});

module.exports = { toolsBasicAuth };
if (require.main === module) cli();
