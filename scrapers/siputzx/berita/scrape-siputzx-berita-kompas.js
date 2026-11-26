#!/usr/bin/env node
'use strict';

/**
 * Name : Berita Kompas
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil daftar berita terbaru dari Kompas.
 * Note : node scrapers/siputzx/berita/scrape-siputzx-berita-kompas.js
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/berita/kompas';
const { scrape: beritaKompas, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300 });

module.exports = { beritaKompas };
if (require.main === module) cli();
