#!/usr/bin/env node
'use strict';

/**
 * Name : Kuis Matematika
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil satu soal hitung dan jawabannya pada tingkat kesulitan yang dipilih.
 * Note : node scrapers/siputzx/games/scrape-maths.js --level easy
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/maths';
const { scrape: gamesMaths, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300, cache: false,
  params: { level: { choices: ['noob', 'easy', 'medium', 'hard', 'extreme', 'impossible', 'impossible2', 'impossible3', 'impossible4', 'impossible5'] } }
});

module.exports = { gamesMaths };
if (require.main === module) cli();
