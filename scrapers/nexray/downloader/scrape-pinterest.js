#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media Pinterest untuk konten yang diizinkan.
 * Note : node scrapers/nexray/downloader/scrape-pinterest.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/pinterest';
const { scrape: nexrayDownloaderPinterest, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderPinterest };
if (require.main === module) cli();
