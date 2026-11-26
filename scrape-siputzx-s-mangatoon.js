#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian MangaToon
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari metadata komik dan novel di katalog MangaToon.
 * Note : node scrape-siputzx-s-mangatoon.js --query "cat"
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/mangatoon';
const { scrape: searchMangatoon, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300, params: { query: { required: true } }
});

module.exports = { searchMangatoon };
if (require.main === module) cli();
