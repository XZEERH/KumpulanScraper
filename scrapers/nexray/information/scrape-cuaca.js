#!/usr/bin/env node
'use strict';

/**
 * Name : Cuaca
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/information
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get weather forecast from BMKG for specific location
 * Note : node scrapers/nexray/information/scrape-cuaca.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/information/cuaca';
const { scrape: nexrayInformationCuaca, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    kota: { required: true }
  }
});

module.exports = { nexrayInformationCuaca };
if (require.main === module) cli();
