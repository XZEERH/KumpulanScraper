#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Lagu
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tautan audio kuis, judul lagu, dan nama artis.
 * Note : node scrape-siputzx-games-tebaklagu.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebaklagu';
const { scrape: gamesTebakLagu, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakLagu };
if (require.main === module) cli();
