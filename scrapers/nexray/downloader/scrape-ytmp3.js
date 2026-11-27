#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube-MP3
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Download MP3 dari YouTube
 * Note : node scrapers/nexray/downloader/scrape-ytmp3.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/ytmp3';
const { scrape: nexrayDownloaderYtmp3, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderYtmp3 };
if (require.main === module) cli();
