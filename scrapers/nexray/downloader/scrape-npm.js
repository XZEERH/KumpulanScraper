#!/usr/bin/env node
'use strict';

/**
 * Name : NPM Package
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get information about NPM packages
 * Note : node scrapers/nexray/downloader/scrape-npm.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/npm';
const { scrape: nexrayDownloaderNpm, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexrayDownloaderNpm };
if (require.main === module) cli();
