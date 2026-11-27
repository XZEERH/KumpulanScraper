#!/usr/bin/env node
'use strict';

/**
 * Name : Tafsir Mimpi
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Interpretasi mimpi berdasarkan primbon
 * Note : node scrapers/nexray/primbon/scrape-tafsirmimpi.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/tafsirmimpi';
const { scrape: nexrayPrimbonTafsirmimpi, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    mimpi: { required: true }
  }
});

module.exports = { nexrayPrimbonTafsirmimpi };
if (require.main === module) cli();
