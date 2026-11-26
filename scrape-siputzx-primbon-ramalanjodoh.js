#!/usr/bin/env node
'use strict';

/**
 * Name : Primbon Ramalan Jodoh Jawa
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil ramalan tradisi Jawa dari dua nama dan tanggal lahir, untuk hiburan.
 * Note : node scrape-siputzx-primbon-ramalanjodoh.js --nama1 Budi --tgl1 15 --bln1 5 --thn1 1995 --nama2 Sari --tgl2 20 --bln2 6 --thn2 1996
 */

const { jsonEndpoint, hasText } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/primbon/ramalanjodoh';
const name = { required: true, maxLength: 80 };
const day = { required: true, min: 1, max: 31 };
const month = { required: true, min: 1, max: 12 };
const year = { required: true, min: 1900, max: new Date().getFullYear() };
const { scrape: primbonRamalanJodoh, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, cache: false,
  params: { nama1: name, tgl1: day, bln1: month, thn1: year, nama2: name, tgl2: day, bln2: month, thn2: year },
  validateData: (data) => Array.isArray(data?.result?.hasil_ramalan) && data.result.hasil_ramalan.some(hasText)
});

module.exports = { primbonRamalanJodoh };
if (require.main === module) cli();
