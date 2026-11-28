#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Downloader V2
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Versi alternatif pengunduh audio Spotify dengan dukungan metadata lengkap dan kompatibilitas tautan playlist/album menggunakan mesin Spotidown.
 * Note : node scrapers/ikhlas/downloader/scrape-spotify-v2.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/downloader/spotify-v2';
const { scrape: ikhlasDownloaderSpotifyV2, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { ikhlasDownloaderSpotifyV2 };
if (require.main === module) cli();
