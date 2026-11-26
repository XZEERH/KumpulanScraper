#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Myinstants
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari klip suara di Myinstants berdasarkan kata kunci.
 * Note : node scrape-siputzx-s-myinstants.js --query "cihuyy"
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/myinstants';
const { scrape: searchMyinstants, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300, params: { query: { required: true } }
});

module.exports = { searchMyinstants };
if (require.main === module) cli();
