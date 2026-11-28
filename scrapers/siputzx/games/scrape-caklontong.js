#!/usr/bin/env node
'use strict';

/**
 * Name : Kuis Cak Lontong
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil tebak-tebakan Cak Lontong, jawaban, dan penjelasan.
 * Note : node scrapers/siputzx/games/scrape-caklontong.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/games/caklontong';
const { scrape: gamesCakLontong, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300, cache: false });

module.exports = { gamesCakLontong };
if (require.main === module) cli();
