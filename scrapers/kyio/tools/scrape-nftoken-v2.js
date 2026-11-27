#!/usr/bin/env node
'use strict';

/**
 * Name : Netflix NFToken Generator V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Pembuat token login otomatis Netflix V2 multi-device (PC Web, Android App, Smart TV 6-PIN & 8-PIN).
 * Note : node scrapers/kyio/tools/scrape-nftoken-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/nftoken-v2';
const { scrape: toolsNftokenV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    plan: {},
    count: {}
  }
});

module.exports = { toolsNftokenV2 };
if (require.main === module) cli();
