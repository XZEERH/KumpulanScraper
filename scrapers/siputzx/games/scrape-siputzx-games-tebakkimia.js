#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Kimia
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil nama unsur kimia dan lambangnya untuk kuis.
 * Note : node scrapers/siputzx/games/scrape-siputzx-games-tebakkimia.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebakkimia';
const { scrape: gamesTebakKimia, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakKimia };
if (require.main === module) cli();
