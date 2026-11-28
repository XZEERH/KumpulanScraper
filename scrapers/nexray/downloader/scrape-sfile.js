#!/usr/bin/env node
'use strict';

/**
 * Name : SFile
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media SFile untuk konten yang diizinkan.
 * Note : node scrapers/nexray/downloader/scrape-sfile.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/sfile';
const { scrape: nexrayDownloaderSfile, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderSfile };
if (require.main === module) cli();
