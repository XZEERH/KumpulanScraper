#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Gambar
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil teka-teki gambar beserta jawaban dan penjelasannya.
 * Note : node scrape-siputzx-games-tebakgambar.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebakgambar';
const { scrape: gamesTebakGambar, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakGambar };
if (require.main === module) cli();
