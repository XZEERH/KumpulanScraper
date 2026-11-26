#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Welcome V3
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat kartu sambutan V3 dari nama pengguna dan avatar.
 * Note : node scrape-siputzx-canvas-welcomev3.js --username Demo --avatar "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png"
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/welcomev3';
const { scrape: canvasWelcomeV3, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { username: { required: true, maxLength: 80 }, avatar: { required: true, type: 'image-url' } }
});

module.exports = { canvasWelcomeV3 };
if (require.main === module) cli();
