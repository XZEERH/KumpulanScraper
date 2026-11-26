#!/usr/bin/env node
'use strict';

/**
 * Name : Kuis Family 100
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil satu pertanyaan Family 100 beserta daftar jawabannya.
 * Note : node scrape-siputzx-games-family100.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/family100';
const { scrape: gamesFamily100, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesFamily100 };
if (require.main === module) cli();
