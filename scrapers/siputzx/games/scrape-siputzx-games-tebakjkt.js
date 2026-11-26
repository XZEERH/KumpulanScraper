#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak JKT48
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil gambar dan jawaban untuk kuis anggota JKT48.
 * Note : node scrapers/siputzx/games/scrape-siputzx-games-tebakjkt.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebakjkt';
const { scrape: gamesTebakJkt, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakJkt };
if (require.main === module) cli();
