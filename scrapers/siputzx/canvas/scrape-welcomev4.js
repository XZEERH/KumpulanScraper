#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Welcome V4
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat kartu sambutan V4 dengan pesan kustom.
 * Note : node scrapers/siputzx/canvas/scrape-welcomev4.js --avatar "https://placehold.co/150x150.png" --background "https://placehold.co/400x300.png" --description "Selamat datang!"
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/welcomev4';
const image = { required: true, type: 'image-url' };
const { scrape: canvasWelcomeV4, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { avatar: image, background: image, description: { required: true, maxLength: 250 } }
});

module.exports = { canvasWelcomeV4 };
if (require.main === module) cli();
