#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest Downloader
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil tautan unduhan gambar resolusi asli berkualitas tinggi maupun video MP4 dari pin Pinterest berdasarkan URL pin.
 * Note : node scrapers/ikhlas/downloader/scrape-pinterest.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/downloader/pinterest';
const { scrape: ikhlasDownloaderPinterest, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { ikhlasDownloaderPinterest };
if (require.main === module) cli();
