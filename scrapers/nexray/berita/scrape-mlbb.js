#!/usr/bin/env node
'use strict';

/**
 * Name : MLBB News
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/berita
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Dapatkan berita terbaru Mobile Legends
 * Note : node scrapers/nexray/berita/scrape-mlbb.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/berita/mlbb';
const { scrape: nexrayBeritaMlbb, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayBeritaMlbb };
if (require.main === module) cli();
