#!/usr/bin/env node
'use strict';

/**
 * Name : Google Drive
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media Google Drive untuk konten yang diizinkan.
 * Note : node scrapers/nexray/downloader/scrape-googledrive.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/googledrive';
const { scrape: nexrayDownloaderGoogledrive, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderGoogledrive };
if (require.main === module) cli();
