#!/usr/bin/env node
'use strict';

/**
 * Name : Antara
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/berita
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan berita terbaru dari Antara News
 * Note : node scrapers/nexray/berita/scrape-antara.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/berita/antara';
const { scrape: nexrayBeritaAntara, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayBeritaAntara };
if (require.main === module) cli();
