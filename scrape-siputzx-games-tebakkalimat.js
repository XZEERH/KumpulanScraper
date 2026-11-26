#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Kalimat
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil soal tebak kalimat acak beserta jawabannya.
 * Note : node scrape-siputzx-games-tebakkalimat.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebakkalimat';
const { scrape: gamesTebakKalimat, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakKalimat };
if (require.main === module) cli();
