#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Logo
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil soal kuis logo acak.
 * Note : node scrapers/siputzx/games/scrape-siputzx-games-tebaklogo.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebaklogo';
const { scrape: gamesTebakLogo, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakLogo };
if (require.main === module) cli();
