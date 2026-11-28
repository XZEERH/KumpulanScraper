#!/usr/bin/env node
'use strict';

/**
 * Name : Berita Liputan6
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil daftar berita terbaru dari Liputan6.
 * Note : node scrapers/siputzx/berita/scrape-liputan6.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/berita/liputan6';
const { scrape: beritaLiputan6, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300 });

module.exports = { beritaLiputan6 };
if (require.main === module) cli();
