#!/usr/bin/env node
'use strict';

/**
 * Name : GitHub
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Download GitHub repositories
 * Note : node scrapers/nexray/downloader/scrape-github.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/github';
const { scrape: nexrayDownloaderGithub, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { nexrayDownloaderGithub };
if (require.main === module) cli();
