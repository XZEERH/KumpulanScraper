#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Welcome V1
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat kartu sambutan dengan nama server, ikon, dan avatar.
 * Note : node scrape-siputzx-canvas-welcomev1.js --username Demo --guildName Demo --memberCount 12 --avatar "https://placehold.co/150x150.png" --guildIcon "https://placehold.co/150x150.png" --background "https://placehold.co/400x300.png"
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/welcomev1';
const image = { required: true, type: 'image-url' };
const { scrape: canvasWelcomeV1, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    username: { required: true, maxLength: 80 }, guildName: { required: true, maxLength: 100 },
    memberCount: { required: true, min: 0, max: 100000000 }, avatar: image, guildIcon: image, background: image,
    quality: { min: 1, max: 100 }
  }
});

module.exports = { canvasWelcomeV1 };
if (require.main === module) cli();
