#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Gambar Bing
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari tautan gambar Bing berdasarkan kata kunci.
 * Note : node scrapers/siputzx/search/scrape-bimg.js --query "kucing"
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/bimg';
const { scrape: searchBimg, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300, params: { query: { required: true } }
});

module.exports = { searchBimg };
if (require.main === module) cli();
