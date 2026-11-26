#!/usr/bin/env node
'use strict';

/**
 * Name : Teka-teki
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil satu teka-teki acak beserta jawabannya.
 * Note : node scrape-siputzx-games-tekateki.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/tekateki';
const { scrape: gamesTekaTeki, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesTekaTeki };
if (require.main === module) cli();
