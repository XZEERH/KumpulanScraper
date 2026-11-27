#!/usr/bin/env node
'use strict';

/**
 * Name : Arti Nama
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil penafsiran arti nama, gambaran karakter bawaan, serta nilai filosofis sebuah nama berdasarkan tradisi Primbon Nusantara.
 * Note : node scrapers/ikhlas/primbon/scrape-artinama.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/primbon/artinama';
const { scrape: ikhlasPrimbonArtinama, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    nama: { required: true }
  }
});

module.exports = { ikhlasPrimbonArtinama };
if (require.main === module) cli();
