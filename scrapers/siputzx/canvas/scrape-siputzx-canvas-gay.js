#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Avatar Pelangi
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Merender efek visual pelangi. Angka dipilih pengguna, bukan penilaian orientasi seseorang.
 * Note : node scrapers/siputzx/canvas/scrape-siputzx-canvas-gay.js --nama Demo --avatar "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png" --num 87
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/gay';
const { scrape: canvasRainbowAvatar, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    nama: { required: true, maxLength: 80 }, avatar: { required: true, type: 'image-url' },
    num: { required: true, min: 0, max: 100 }
  }
});

module.exports = { canvasRainbowAvatar };
if (require.main === module) cli();
