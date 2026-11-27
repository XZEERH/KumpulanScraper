#!/usr/bin/env node
'use strict';

/**
 * Name : Bilibili Downloader
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil tautan unduhan video Bilibili format MP4 resolusi tinggi serta subtitle (bila tersedia) dari bilibili.com, b23.tv, maupun bilibili.tv.
 * Note : node scrapers/ikhlas/downloader/scrape-bilibili.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/downloader/bilibili';
const { scrape: ikhlasDownloaderBilibili, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { ikhlasDownloaderBilibili };
if (require.main === module) cli();
