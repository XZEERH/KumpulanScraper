#!/usr/bin/env node
'use strict';

/**
 * Name : Cerdas Cermat SD
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil 5 sampai 10 soal kuis berdasarkan mata pelajaran SD.
 * Note : node scrape-siputzx-games-cc-sd.js --matapelajaran matematika --jumlahsoal 5
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/cc-sd';
const { scrape: gamesCerdasCermat, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300, cache: false,
  params: {
    matapelajaran: { required: true, choices: ['bindo', 'tik', 'pkn', 'bing', 'penjas', 'pai', 'matematika', 'jawa', 'ips', 'ipa'] },
    jumlahsoal: { min: 5, max: 10 }
  }
});

module.exports = { gamesCerdasCermat };
if (require.main === module) cli();
