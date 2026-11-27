#!/usr/bin/env node
'use strict';

/**
 * Name : Sifat Usaha Bisnis
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Memberikan gambaran karakter kewirausahaan, bidang usaha yang cocok, serta potensi kesuksesan finansial berdasarkan tanggal lahir menurut Primbon.
 * Note : node scrapers/ikhlas/primbon/scrape-sifat-usaha-bisnis.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/primbon/sifat_usaha_bisnis';
const { scrape: ikhlasPrimbonSifatUsahaBisnis, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    tgl: { required: true },
    bln: { required: true },
    thn: { required: true }
  }
});

module.exports = { ikhlasPrimbonSifatUsahaBisnis };
if (require.main === module) cli();
