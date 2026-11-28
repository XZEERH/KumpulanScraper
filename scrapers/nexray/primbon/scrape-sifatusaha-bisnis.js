#!/usr/bin/env node
'use strict';

/**
 * Name : Sifat Usaha Bisnis
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Menganalisis sifat dan karakter usaha/bisnis berdasarkan tanggal lahir
 * Note : node scrapers/nexray/primbon/scrape-sifatusaha-bisnis.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/sifatusaha-bisnis';
const { scrape: nexrayPrimbonSifatusahaBisnis, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    tanggal: { required: true },
    bulan: { required: true },
    tahun: { required: true }
  }
});

module.exports = { nexrayPrimbonSifatusahaBisnis };
if (require.main === module) cli();
