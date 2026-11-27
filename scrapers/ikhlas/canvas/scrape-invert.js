#!/usr/bin/env node
'use strict';

/**
 * Name : Invert Image
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membalik spektrum warna gambar asli secara menyeluruh menghasilkan efek negatif artistik.
 * Note : node scrapers/ikhlas/canvas/scrape-invert.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/invert';
const { scrape: ikhlasCanvasInvert, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasInvert };
if (require.main === module) cli();
