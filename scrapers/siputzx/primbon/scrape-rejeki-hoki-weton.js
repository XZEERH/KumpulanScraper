#!/usr/bin/env node
'use strict';

/**
 * Name : Primbon Rejeki Hoki Weton
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tafsiran weton menurut tradisi Jawa; bukan saran keuangan.
 * Note : node scrapers/siputzx/primbon/scrape-rejeki-hoki-weton.js --tgl 15 --bln 5 --thn 1995
 */

const { jsonEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/primbon/rejeki_hoki_weton';
const { scrape: primbonRejekiWeton, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, cache: false,
  params: {
    tgl: { required: true, min: 1, max: 31 }, bln: { required: true, min: 1, max: 12 },
    thn: { required: true, min: 1900, max: new Date().getFullYear() }
  },
  validateData: (data) => hasText(data?.hari_lahir) && hasText(data.rejeki)
});

module.exports = { primbonRejekiWeton };
if (require.main === module) cli();
