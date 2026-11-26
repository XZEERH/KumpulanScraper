#!/usr/bin/env node
'use strict';

/**
 * Name : Informasi Negara
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari informasi negara, termasuk ibu kota, bahasa, dan mata uang.
 * Note : node scrape-siputzx-tools-country-info.js --name "Indonesia"
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/tools/countryInfo';
const { scrape: toolsCountryInfo, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300, params: { name: { required: true } }
});

module.exports = { toolsCountryInfo };
if (require.main === module) cli();
