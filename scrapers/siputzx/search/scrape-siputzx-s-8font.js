#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian 8font
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari metadata dan pratinjau katalog font; tidak mengunduh font.
 * Note : node scrapers/siputzx/search/scrape-siputzx-s-8font.js --query cartoon --page 1
 */

const { jsonEndpoint, hasText, httpsUrl } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/8font';
const { scrape: search8Font, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { query: { required: true }, page: { min: 1, max: 100 } },
  validateData: (data) => Array.isArray(data) && data.some((item) => hasText(item?.title) && httpsUrl(item.image))
});

module.exports = { search8Font };
if (require.main === module) cli();
