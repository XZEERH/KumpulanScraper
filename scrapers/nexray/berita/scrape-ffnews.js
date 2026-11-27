#!/usr/bin/env node
'use strict';

/**
 * Name : Free Fire News
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/berita
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Dapatkan berita informasi Free Fire
 * Note : node scrapers/nexray/berita/scrape-ffnews.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/berita/ffnews';
const { scrape: nexrayBeritaFfnews, cli } = nexrayEndpoint(ENDPOINT);

module.exports = { nexrayBeritaFfnews };
if (require.main === module) cli();
