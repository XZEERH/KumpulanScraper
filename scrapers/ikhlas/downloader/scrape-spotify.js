#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Downloader
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil tautan unduhan audio MP3 320kbps langsung dan metadata lagu dari Spotify menggunakan mesin Spotisaver.
 * Note : node scrapers/ikhlas/downloader/scrape-spotify.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/downloader/spotify';
const { scrape: ikhlasDownloaderSpotify, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { ikhlasDownloaderSpotify };
if (require.main === module) cli();
