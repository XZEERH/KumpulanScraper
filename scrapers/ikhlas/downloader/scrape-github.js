#!/usr/bin/env node
'use strict';

/**
 * Name : GitHub Downloader
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil data terstruktur dari sebuah URL GitHub, baik berupa informasi repositori, file tunggal, berkas raw, maupun cuplikan gist.
 * Note : node scrapers/ikhlas/downloader/scrape-github.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/downloader/github';
const { scrape: ikhlasDownloaderGithub, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { ikhlasDownloaderGithub };
if (require.main === module) cli();
