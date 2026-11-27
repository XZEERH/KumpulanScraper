#!/usr/bin/env node
'use strict';

/**
 * Name : Website Screenshot
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Capture a high-quality screenshot of any website using the Pikwy engine.
 * Note : node scrapers/kyio/tools/scrape-ssweb.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/ssweb';
const { scrape: toolsSsweb, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { toolsSsweb };
if (require.main === module) cli();
