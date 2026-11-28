#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram v1
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Download video/foto dari Instagram
 * Note : node scrapers/nexray/downloader/scrape-v1-instagram.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/v1/instagram';
const { scrape: nexrayDownloaderV1Instagram, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderV1Instagram };
if (require.main === module) cli();
