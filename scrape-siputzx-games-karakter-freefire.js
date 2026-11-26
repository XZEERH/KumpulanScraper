#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Karakter Free Fire
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil gambar karakter Free Fire dan nama untuk jawaban kuis.
 * Note : node scrape-siputzx-games-karakter-freefire.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/karakter-freefire';
const { scrape: gamesKarakterFreeFire, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesKarakterFreeFire };
if (require.main === module) cli();
