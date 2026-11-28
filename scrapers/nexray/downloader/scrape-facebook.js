#!/usr/bin/env node
'use strict';

/**
 * Name : Facebook
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media Facebook untuk konten yang diizinkan.
 * Note : node scrapers/nexray/downloader/scrape-facebook.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/facebook';
const { scrape: nexrayDownloaderFacebook, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderFacebook };
if (require.main === module) cli();
