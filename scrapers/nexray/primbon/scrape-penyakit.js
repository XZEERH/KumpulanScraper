#!/usr/bin/env node
'use strict';

/**
 * Name : Cek Potensi Penyakit
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Cek potensi penyakit berdasarkan tanggal lahir dengan metode Pitagoras
 * Note : node scrapers/nexray/primbon/scrape-penyakit.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/penyakit';
const { scrape: nexrayPrimbonPenyakit, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    tanggal: { required: true },
    bulan: { required: true },
    tahun: { required: true }
  }
});

module.exports = { nexrayPrimbonPenyakit };
if (require.main === module) cli();
