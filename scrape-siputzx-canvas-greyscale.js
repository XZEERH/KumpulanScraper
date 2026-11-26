#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Greyscale
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengubah gambar publik menjadi abu-abu.
 * Note : node scrape-siputzx-canvas-greyscale.js --image "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png"
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/greyscale';
const { scrape: canvasGreyscale, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { image: { required: true, type: 'image-url' } }
});

module.exports = { canvasGreyscale };
if (require.main === module) cli();
