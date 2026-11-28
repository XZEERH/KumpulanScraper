#!/usr/bin/env node
'use strict';

/**
 * Name : Douyin
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan media Douyin untuk konten yang diizinkan.
 * Note : node scrapers/nexray/downloader/scrape-douyin.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/douyin';
const { scrape: nexrayDownloaderDouyin, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderDouyin };
if (require.main === module) cli();
