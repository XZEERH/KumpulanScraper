#!/usr/bin/env node
'use strict';

/**
 * Name : CapCut v1
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media CapCut v1 untuk konten yang diizinkan.
 * Note : node scrapers/nexray/downloader/scrape-v1-capcut.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/v1/capcut';
const { scrape: nexrayDownloaderV1Capcut, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderV1Capcut };
if (require.main === module) cli();
