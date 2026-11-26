#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Batman Meme
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Menempatkan dua gambar publik pada templat meme komik Batman.
 * Note : node scrape-siputzx-canvas-batslap.js --image1 "https://placehold.co/150x150.png" --image2 "https://placehold.co/200x200.png"
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/batslap';
const { scrape: canvasBatslap, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { image1: { required: true, type: 'image-url' }, image2: { required: true, type: 'image-url' } }
});

module.exports = { canvasBatslap };
if (require.main === module) cli();
