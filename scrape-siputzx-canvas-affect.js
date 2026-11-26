#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Affect
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat gambar meme Affect dari gambar publik dan mengembalikan Base64.
 * Note : node scrape-siputzx-canvas-affect.js --image "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png"
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/affect';
const { scrape: canvasAffect, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { image: { required: true, type: 'image-url' } }
});

module.exports = { canvasAffect };
if (require.main === module) cli();
