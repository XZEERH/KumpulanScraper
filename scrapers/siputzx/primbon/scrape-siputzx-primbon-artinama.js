#!/usr/bin/env node
'use strict';

/**
 * Name : Primbon Arti Nama
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tafsiran nama menurut tradisi Primbon untuk hiburan.
 * Note : node scrapers/siputzx/primbon/scrape-siputzx-primbon-artinama.js --nama Budi
 */

const { jsonEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/primbon/artinama';
const { scrape: primbonArtiNama, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, cache: false, params: { nama: { required: true, maxLength: 80 } },
  validateData: (data) => hasText(data?.nama) && hasText(data.arti)
});

module.exports = { primbonArtiNama };
if (require.main === module) cli();
