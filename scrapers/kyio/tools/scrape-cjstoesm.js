#!/usr/bin/env node
'use strict';

/**
 * Name : CJS to ESM
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Convert JavaScript CommonJS code to ES Modules
 * Note : node scrapers/kyio/tools/scrape-cjstoesm.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/cjstoesm';
const { scrape: toolsCjstoesm, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    code: { required: true }
  }
});

module.exports = { toolsCjstoesm };
if (require.main === module) cli();
