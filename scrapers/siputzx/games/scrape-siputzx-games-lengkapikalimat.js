#!/usr/bin/env node
'use strict';

/**
 * Name : Lengkapi Kalimat
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil soal untuk melengkapi kalimat dan jawabannya.
 * Note : node scrapers/siputzx/games/scrape-siputzx-games-lengkapikalimat.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/lengkapikalimat';
const { scrape: gamesLengkapiKalimat, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesLengkapiKalimat };
if (require.main === module) cli();
