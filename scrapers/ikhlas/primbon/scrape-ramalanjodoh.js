#!/usr/bin/env node
'use strict';

/**
 * Name : Ramalan Jodoh
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan analisis ramalan kecocokan pernikahan dan perhitungan nasib rumah tangga berdasarkan kitab Primbon Jawa Betaljemur Adammakna.
 * Note : node scrapers/ikhlas/primbon/scrape-ramalanjodoh.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/primbon/ramalanjodoh';
const { scrape: ikhlasPrimbonRamalanjodoh, cli } = documentedEndpoint(ENDPOINT, {
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

module.exports = { ikhlasPrimbonRamalanjodoh };
if (require.main === module) cli();
