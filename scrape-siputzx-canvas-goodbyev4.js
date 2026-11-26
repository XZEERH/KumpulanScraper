#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Goodbye V4
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat kartu perpisahan V4 dengan judul, pesan, dan opsi bingkai.
 * Note : node scrape-siputzx-canvas-goodbyev4.js --avatar "https://placehold.co/150x150.png" --background "https://placehold.co/400x300.png" --title "Sampai jumpa" --description "Terima kasih!"
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/goodbyev4';
const image = { required: true, type: 'image-url' };
const color = { pattern: /^#[\da-f]{6}$/i };
const { scrape: canvasGoodbyeV4, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    avatar: image, background: image, title: { required: true, maxLength: 80 }, description: { required: true, maxLength: 250 },
    border: color, avatarBorder: color, overlayOpacity: { type: 'number', min: 0, max: 1 }
  }
});

module.exports = { canvasGoodbyeV4 };
if (require.main === module) cli();
