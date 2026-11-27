#!/usr/bin/env node
'use strict';

/**
 * Name : Twitter
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Download Twitter (X) videos, images
 * Note : node scrapers/nexray/downloader/scrape-twitter.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/twitter';
const { scrape: nexrayDownloaderTwitter, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderTwitter };
if (require.main === module) cli();
