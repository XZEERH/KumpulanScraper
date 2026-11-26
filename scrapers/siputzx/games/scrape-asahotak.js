#!/usr/bin/env node
'use strict';

/**
 * Name : Asah Otak
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil satu soal asah otak acak beserta jawabannya.
 * Note : node scrapers/siputzx/games/scrape-asahotak.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/asahotak';
const { scrape: gamesAsahOtak, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesAsahOtak };
if (require.main === module) cli();
