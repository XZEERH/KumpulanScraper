#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Kata
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil petunjuk dan kata yang menjadi jawaban.
 * Note : node scrapers/siputzx/games/scrape-siputzx-games-tebakkata.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebakkata';
const { scrape: gamesTebakKata, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakKata };
if (require.main === module) cli();
