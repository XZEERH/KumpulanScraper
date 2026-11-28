#!/usr/bin/env node
'use strict';

/**
 * Name : Kecocokan Nama Pasangan
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil detail analisis tingkat kecocokan, daya tarik, dan potensi keharmonisan antara dua nama pasangan berdasarkan Primbon.
 * Note : node scrapers/ikhlas/primbon/scrape-kecocokan-nama-pasangan.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/primbon/kecocokan_nama_pasangan';
const { scrape: ikhlasPrimbonKecocokanNamaPasangan, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    nama1: { required: true },
    nama2: { required: true }
  }
});

module.exports = { ikhlasPrimbonKecocokanNamaPasangan };
if (require.main === module) cli();
