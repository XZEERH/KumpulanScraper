#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Facepalm
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat komposisi meme Facepalm dari gambar publik.
 * Note : node scrapers/siputzx/canvas/scrape-facepalm.js --image "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png"
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/facepalm';
const { scrape: canvasFacepalm, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { image: { required: true, type: 'image-url' } }
});

module.exports = { canvasFacepalm };
if (require.main === module) cli();
