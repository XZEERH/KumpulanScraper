#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram v2
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Download video/foto dari Instagram
 * Note : node scrapers/nexray/downloader/scrape-v2-instagram.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/v2/instagram';
const { scrape: nexrayDownloaderV2Instagram, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderV2Instagram };
if (require.main === module) cli();
