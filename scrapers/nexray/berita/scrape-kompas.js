#!/usr/bin/env node
'use strict';

/**
 * Name : Kompas
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/berita
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan berita terbaru dari Kompas
 * Note : node scrapers/nexray/berita/scrape-kompas.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/berita/kompas';
const { scrape: nexrayBeritaKompas, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayBeritaKompas };
if (require.main === module) cli();
