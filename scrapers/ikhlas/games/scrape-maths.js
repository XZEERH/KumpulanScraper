#!/usr/bin/env node
'use strict';

/**
 * Name : Soal Matematika
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menghasilkan soal latihan matematika acak beserta kunci jawaban berdasarkan tingkat kesulitan yang ditentukan (dari noob, easy, medium, hard, extreme, hingga impossible 1-5) untuk melatih ketangkasan berhitung.
 * Note : node scrapers/ikhlas/games/scrape-maths.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/maths';
const { scrape: ikhlasGamesMaths, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    level: { choices: ['noob', 'easy', 'medium', 'hard', 'extreme', 'impossible', 'impossible2', 'impossible3', 'impossible4', 'impossible5'] }
  }
});

module.exports = { ikhlasGamesMaths };
if (require.main === module) cli();
