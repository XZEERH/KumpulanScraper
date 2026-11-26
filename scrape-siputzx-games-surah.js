#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Surah
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil satu ayat acak dengan teks, tautan audio, dan informasi surah.
 * Note : node scrape-siputzx-games-surah.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/surah';
const { scrape: gamesSurah, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesSurah };
if (require.main === module) cli();
