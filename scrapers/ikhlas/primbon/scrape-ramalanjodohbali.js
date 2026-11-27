#!/usr/bin/env node
'use strict';

/**
 * Name : Ramalan Jodoh Bali
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan analisis ramalan kecocokan pernikahan, rezeki bersama, dan keharmonisan rumah tangga berbasis Primbon Bali menggunakan metode Pal Sri Sedanai.
 * Note : node scrapers/ikhlas/primbon/scrape-ramalanjodohbali.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/primbon/ramalanjodohbali';
const { scrape: ikhlasPrimbonRamalanjodohbali, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    nama1: { required: true },
    tgl1: { required: true },
    bln1: { required: true },
    thn1: { required: true },
    nama2: { required: true },
    tgl2: { required: true },
    bln2: { required: true },
    thn2: { required: true }
  }
});

module.exports = { ikhlasPrimbonRamalanjodohbali };
if (require.main === module) cli();
