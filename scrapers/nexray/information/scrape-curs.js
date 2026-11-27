#!/usr/bin/env node
'use strict';

/**
 * Name : Curs
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/information
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambi informasi data perbandingan antar nilai tukar mata uang
 * Note : node scrapers/nexray/information/scrape-curs.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/information/curs';
const { scrape: nexrayInformationCurs, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    amount: { required: true },
    source: { required: true },
    target: { required: true }
  }
});

module.exports = { nexrayInformationCurs };
if (require.main === module) cli();
