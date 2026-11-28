#!/usr/bin/env node
'use strict';

/**
 * Name : Arti Nama
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan arti nama dari primbon
 * Note : node scrapers/nexray/primbon/scrape-artinama.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/artinama';
const { scrape: nexrayPrimbonArtinama, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    name: { required: true }
  }
});

module.exports = { nexrayPrimbonArtinama };
if (require.main === module) cli();
