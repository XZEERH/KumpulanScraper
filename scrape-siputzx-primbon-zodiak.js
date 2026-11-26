#!/usr/bin/env node
'use strict';

/**
 * Name : Primbon Zodiak
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil ringkasan salah satu dari 12 zodiak sebagai hiburan.
 * Note : node scrape-siputzx-primbon-zodiak.js --zodiak aries
 */

const { jsonEndpoint, hasText } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/primbon/zodiak';
const { scrape: primbonZodiak, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { zodiak: { required: true, choices: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagitarius', 'capricorn', 'aquarius', 'pisces'] } },
  validateData: (data) => hasText(data?.zodiak) && hasText(data.nomor_keberuntungan)
});

module.exports = { primbonZodiak };
if (require.main === module) cli();
