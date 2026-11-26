#!/usr/bin/env node
'use strict';

/**
 * Name : Berita ANTARA
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil daftar berita terbaru dari ANTARA.
 * Note : node scrapers/siputzx/berita/scrape-antara.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/berita/antara';
const { scrape: beritaAntara, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300 });

module.exports = { beritaAntara };
if (require.main === module) cli();
