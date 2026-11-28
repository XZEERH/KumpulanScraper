#!/usr/bin/env node
'use strict';

/**
 * Name : CNBC Indonesia
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/berita
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan berita terbaru dari CNBC Indonesia
 * Note : node scrapers/nexray/berita/scrape-cnbcindonesia.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/berita/cnbcindonesia';
const { scrape: nexrayBeritaCnbcindonesia, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayBeritaCnbcindonesia };
if (require.main === module) cli();
