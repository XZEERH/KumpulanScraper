#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak-tebakan
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tebak-tebakan acak beserta jawabannya.
 * Note : node scrapers/siputzx/games/scrape-tebaktebakan.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tebaktebakan';
const { scrape: gamesTebakTebakan, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTebakTebakan };
if (require.main === module) cli();
