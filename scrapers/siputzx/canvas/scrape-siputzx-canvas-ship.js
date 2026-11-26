#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Ship Card
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat kartu dua avatar dengan angka kecocokan dari pengguna.
 * Note : node scrapers/siputzx/canvas/scrape-siputzx-canvas-ship.js --avatar1 "https://placehold.co/150x150.png" --avatar2 "https://placehold.co/200x200.png" --background "https://placehold.co/400x300.png" --persen 20
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/ship';
const image = { required: true, type: 'image-url' };
const { scrape: canvasShip, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { avatar1: image, avatar2: image, background: image, persen: { required: true, min: 0, max: 100 } }
});

module.exports = { canvasShip };
if (require.main === module) cli();
