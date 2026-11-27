#!/usr/bin/env node
'use strict';

/**
 * Name : Ramalan Jodoh
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Ramalan jodoh berdasarkan metode Jawa Betaljemur Adammakna
 * Note : node scrapers/nexray/primbon/scrape-ramalanjodoh.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/ramalanjodoh';
const { scrape: nexrayPrimbonRamalanjodoh, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    nama1: { required: true },
    tanggal1: { required: true },
    bulan1: { required: true },
    tahun1: { required: true },
    nama2: { required: true },
    tanggal2: { required: true },
    bulan2: { required: true },
    tahun2: { required: true }
  }
});

module.exports = { nexrayPrimbonRamalanjodoh };
if (require.main === module) cli();
