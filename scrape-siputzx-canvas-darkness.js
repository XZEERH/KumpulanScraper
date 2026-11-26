#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Darkness
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Menggelapkan gambar publik dengan intensitas opsional.
 * Note : node scrape-siputzx-canvas-darkness.js --image "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png" --amount 50
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/darkness';
const { scrape: canvasDarkness, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { image: { required: true, type: 'image-url' }, amount: { min: 0, max: 255 } }
});

module.exports = { canvasDarkness };
if (require.main === module) cli();
