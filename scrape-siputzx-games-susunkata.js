#!/usr/bin/env node
'use strict';

/**
 * Name : Susun Kata
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil susunan huruf acak dan kata yang menjadi jawabannya.
 * Note : node scrape-siputzx-games-susunkata.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/susunkata';
const { scrape: gamesSusunKata, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesSusunKata };
if (require.main === module) cli();
