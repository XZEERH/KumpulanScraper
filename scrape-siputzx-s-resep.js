#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Resep
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari resep, bahan, dan langkah memasak dari katalog ResepKoki.
 * Note : node scrape-siputzx-s-resep.js --query "nasi goreng"
 */

const { jsonEndpoint, hasText } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/s/resep';
const { scrape: searchResep, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { query: { required: true } },
  validateData: (data) => Array.isArray(data) && data.some((item) => hasText(item?.judul) && hasText(item.bahan))
});

module.exports = { searchResep };
if (require.main === module) cli();
