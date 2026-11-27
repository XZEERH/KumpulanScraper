#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Download video/foto dari TikTok
 * Note : node scrapers/nexray/downloader/scrape-tiktok.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/tiktok';
const { scrape: nexrayDownloaderTiktok, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderTiktok };
if (require.main === module) cli();
