#!/usr/bin/env node
'use strict';

/**
 * Name : Kecocokan Nama Pasangan
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Cek kecocokan jodoh berdasarkan nama pasangan menggunakan metode numerologi.
 * Note : node scrapers/nexray/primbon/scrape-pasangan.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/pasangan';
const { scrape: nexrayPrimbonPasangan, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    nama1: { required: true },
    nama2: { required: true }
  }
});

module.exports = { nexrayPrimbonPasangan };
if (require.main === module) cli();
