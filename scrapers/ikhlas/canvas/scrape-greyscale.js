#!/usr/bin/env node
'use strict';

/**
 * Name : Greyscale Image
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengonversi gambar warna menjadi mode hitam putih dengan kontras dan gradasi tonal yang tajam.
 * Note : node scrapers/ikhlas/canvas/scrape-greyscale.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/greyscale';
const { scrape: ikhlasCanvasGreyscale, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasGreyscale };
if (require.main === module) cli();
