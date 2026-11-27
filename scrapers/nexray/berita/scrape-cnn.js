#!/usr/bin/env node
'use strict';

/**
 * Name : CNN
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/berita
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan berita terbaru dari CNN
 * Note : node scrapers/nexray/berita/scrape-cnn.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/berita/cnn';
const { scrape: nexrayBeritaCnn, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayBeritaCnn };
if (require.main === module) cli();
