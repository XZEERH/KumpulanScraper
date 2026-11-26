#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Bendera
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil gambar bendera dan nama negara untuk kuis.
 * Note : node scrapers/siputzx/games/scrape-siputzx-games-tebakbendera.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebakbendera';
const { scrape: gamesTebakBendera, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakBendera };
if (require.main === module) cli();
