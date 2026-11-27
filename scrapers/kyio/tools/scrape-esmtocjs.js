#!/usr/bin/env node
'use strict';

/**
 * Name : ESM to CJS
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Convert JavaScript ES Modules code to CommonJS
 * Note : node scrapers/kyio/tools/scrape-esmtocjs.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/esmtocjs';
const { scrape: toolsEsmtocjs, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    code: { required: true }
  }
});

module.exports = { toolsEsmtocjs };
if (require.main === module) cli();
