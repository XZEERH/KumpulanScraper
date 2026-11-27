#!/usr/bin/env node
'use strict';

/**
 * Name : Douyin v1
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media Douyin v1 untuk konten yang diizinkan.
 * Note : node scrapers/nexray/downloader/scrape-v1-douyin.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/v1/douyin';
const { scrape: nexrayDownloaderV1Douyin, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderV1Douyin };
if (require.main === module) cli();
