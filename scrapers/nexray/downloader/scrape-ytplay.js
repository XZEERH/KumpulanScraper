#!/usr/bin/env node
'use strict';

/**
 * Name : YT-Play
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media YT-Play untuk konten yang diizinkan.
 * Note : node scrapers/nexray/downloader/scrape-ytplay.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/ytplay';
const { scrape: nexrayDownloaderYtplay, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexrayDownloaderYtplay };
if (require.main === module) cli();
