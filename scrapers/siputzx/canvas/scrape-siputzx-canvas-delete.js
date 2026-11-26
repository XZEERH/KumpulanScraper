#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Delete Meme
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat meme tempat sampah dari gambar; tidak menghapus file.
 * Note : node scrapers/siputzx/canvas/scrape-siputzx-canvas-delete.js --image "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png"
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/delete';
const { scrape: canvasDelete, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { image: { required: true, type: 'image-url' } }
});

module.exports = { canvasDelete };
if (require.main === module) cli();
