#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Lahelu
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari metadata posting publik Lahelu berdasarkan kata kunci.
 * Note : node scrapers/siputzx/search/scrape-siputzx-s-lahelu.js --query "kucing"
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/lahelu';
const { scrape: searchLahelu, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300, params: { query: { required: true } }
});

module.exports = { searchLahelu };
if (require.main === module) cli();
