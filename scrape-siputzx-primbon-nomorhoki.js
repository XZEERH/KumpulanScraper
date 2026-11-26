#!/usr/bin/env node
'use strict';

/**
 * Name : Primbon Nomor Hoki
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil interpretasi angka untuk hiburan; gunakan nomor contoh atau nomor berizin.
 * Note : node scrape-siputzx-primbon-nomorhoki.js --phoneNumber 12025550123
 */

const { jsonEndpoint, hasText } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/primbon/nomorhoki';
const { scrape: primbonNomorHoki, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, cache: false,
  params: { phoneNumber: { required: true, pattern: /^\+?\d{7,15}$/, normalize: (value) => value.replace(/^\+/, '') } },
  mapData(data) {
    if (!Number.isFinite(data?.angka_bagua_shuzi?.value) || !hasText(data.analisis?.description)) return null;
    const { angka_bagua_shuzi, energi_positif, energi_negatif, analisis } = data;
    return { angka_bagua_shuzi, energi_positif, energi_negatif, analisis };
  }
});

module.exports = { primbonNomorHoki };
if (require.main === module) cli();
