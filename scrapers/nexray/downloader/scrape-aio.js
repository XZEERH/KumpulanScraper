#!/usr/bin/env node
'use strict';

/**
 * Name : All-in-One
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Download video from various social media platforms
 * Note : node scrapers/nexray/downloader/scrape-aio.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/aio';
const { scrape: nexrayDownloaderAio, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderAio };
if (require.main === module) cli();
