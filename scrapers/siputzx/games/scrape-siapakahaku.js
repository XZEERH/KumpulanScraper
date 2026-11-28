#!/usr/bin/env node
'use strict';

/**
 * Name : Kuis Siapakah Aku
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil teka-teki identitas acak beserta jawabannya.
 * Note : node scrapers/siputzx/games/scrape-siapakahaku.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/siapakahaku';
const { scrape: gamesSiapakahAku, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesSiapakahAku };
if (require.main === module) cli();
