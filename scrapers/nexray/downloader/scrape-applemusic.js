#!/usr/bin/env node
'use strict';

/**
 * Name : Apple Music
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media Apple Music untuk konten yang diizinkan.
 * Note : node scrapers/nexray/downloader/scrape-applemusic.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/applemusic';
const { scrape: nexrayDownloaderApplemusic, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderApplemusic };
if (require.main === module) cli();
