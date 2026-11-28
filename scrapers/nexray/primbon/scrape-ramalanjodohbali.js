#!/usr/bin/env node
'use strict';

/**
 * Name : Ramalan Jodoh Bali
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/primbon
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Ramalan jodoh berdasarkan metode Bali Pal Sri Sedanai
 * Note : node scrapers/nexray/primbon/scrape-ramalanjodohbali.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/primbon/ramalanjodohbali';
const { scrape: nexrayPrimbonRamalanjodohbali, cli } = nexrayEndpoint(ENDPOINT, {
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

module.exports = { nexrayPrimbonRamalanjodohbali };
if (require.main === module) cli();
