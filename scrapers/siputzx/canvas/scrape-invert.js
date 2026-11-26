#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Invert
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membalik warna gambar publik menjadi warna negatif.
 * Note : node scrapers/siputzx/canvas/scrape-invert.js --image "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png"
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/invert';
const { scrape: canvasInvert, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { image: { required: true, type: 'image-url' } }
});

module.exports = { canvasInvert };
if (require.main === module) cli();
