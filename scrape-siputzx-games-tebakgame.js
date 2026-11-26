#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Game
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil gambar petunjuk dan judul game sebagai jawaban.
 * Note : node scrape-siputzx-games-tebakgame.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebakgame';
const { scrape: gamesTebakGame, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakGame };
if (require.main === module) cli();
