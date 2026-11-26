#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Warna
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil gambar pola warna dan jawaban untuk kuis.
 * Note : node scrapers/siputzx/games/scrape-siputzx-games-tebakwarna.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebakwarna';
const { scrape: gamesTebakWarna, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakWarna };
if (require.main === module) cli();
