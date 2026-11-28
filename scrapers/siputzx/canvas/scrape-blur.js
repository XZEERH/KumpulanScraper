#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Blur
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Memburamkan gambar publik dan mengembalikan hasil sebagai Base64.
 * Note : node scrapers/siputzx/canvas/scrape-blur.js --image "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png"
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/blur';
const { scrape: canvasBlur, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { image: { required: true, type: 'image-url' } }
});

module.exports = { canvasBlur };
if (require.main === module) cli();
