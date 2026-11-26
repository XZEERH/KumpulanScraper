#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Kiss Meme
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat meme dua avatar. Gunakan gambar milik sendiri atau berizin.
 * Note : node scrape-siputzx-canvas-kiss.js --image1 "https://placehold.co/150x150.png" --image2 "https://placehold.co/200x200.png"
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/kiss';
const { scrape: canvasKiss, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { image1: { required: true, type: 'image-url' }, image2: { required: true, type: 'image-url' } }
});

module.exports = { canvasKiss };
if (require.main === module) cli();
