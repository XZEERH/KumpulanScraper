#!/usr/bin/env node
'use strict';

/**
 * Name : Primbon Kecocokan Nama Pasangan
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil ramalan kecocokan dua nama menurut Primbon, untuk hiburan.
 * Note : node scrapers/siputzx/primbon/scrape-siputzx-primbon-kecocokan-nama-pasangan.js --nama1 Budi --nama2 Sari
 */

const { jsonEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/primbon/kecocokan_nama_pasangan';
const name = { required: true, maxLength: 80 };
const { scrape: primbonKecocokanNama, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, cache: false, params: { nama1: name, nama2: name },
  validateData: (data) => hasText(data?.sisi_positif) && hasText(data.sisi_negatif)
});

module.exports = { primbonKecocokanNama };
if (require.main === module) cli();
