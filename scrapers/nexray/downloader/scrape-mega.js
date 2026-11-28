#!/usr/bin/env node
'use strict';

/**
 * Name : Mega
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/downloader
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mengambil metadata dan tautan berkas MEGA dari URL berbagi publik.
 * Note : node scrapers/nexray/downloader/scrape-mega.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/downloader/mega';
const { scrape: nexrayDownloaderMega, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    url: { required: true, url: true, hosts: ['mega.nz', 'www.mega.nz'], preserveFragment: true }
  }
});

module.exports = { nexrayDownloaderMega };
if (require.main === module) cli();
