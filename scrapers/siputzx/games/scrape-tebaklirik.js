#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Lirik
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil petunjuk berupa cuplikan lirik dan jawaban kuis.
 * Note : node scrapers/siputzx/games/scrape-tebaklirik.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebaklirik';
const { scrape: gamesTebakLirik, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakLirik };
if (require.main === module) cli();
