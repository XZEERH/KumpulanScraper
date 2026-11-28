#!/usr/bin/env node
'use strict';

/**
 * Name : Cerdas Cermat SD
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan kumpulan soal cerdas cermat interaktif untuk tingkat sekolah dasar berdasarkan mata pelajaran pilihan (Matematika, IPA, IPS, Bahasa Indonesia, Bahasa Inggris, PKn, PAI, TIK, Penjas, atau Bahasa Jawa) lengkap dengan opsi pilihan ganda dan kunci jawaban.
 * Note : node scrapers/ikhlas/games/scrape-cc-sd.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/cc-sd';
const { scrape: ikhlasGamesCcSd, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    matapelajaran: { required: true, choices: ['bindo', 'tik', 'pkn', 'bing', 'penjas', 'pai', 'matematika', 'jawa', 'ips', 'ipa'] },
    jumlahsoal: {}
  }
});

module.exports = { ikhlasGamesCcSd };
if (require.main === module) cli();
