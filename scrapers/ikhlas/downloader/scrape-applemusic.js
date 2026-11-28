#!/usr/bin/env node
'use strict';

/**
 * Name : Apple Music Downloader
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil tautan unduhan audio MP3 kualitas jernih (320kbps) beserta metadata trek dari Apple Music berdasarkan URL lagu.
 * Note : node scrapers/ikhlas/downloader/scrape-applemusic.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/downloader/applemusic';
const { scrape: ikhlasDownloaderApplemusic, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { ikhlasDownloaderApplemusic };
if (require.main === module) cli();
