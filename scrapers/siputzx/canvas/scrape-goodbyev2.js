#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Goodbye V2
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat kartu perpisahan V2 dengan avatar, latar, dan jumlah anggota.
 * Note : node scrapers/siputzx/canvas/scrape-goodbyev2.js --username Demo --guildName Demo --memberCount 12 --avatar "https://placehold.co/150x150.png" --background "https://placehold.co/400x300.png"
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/goodbyev2';
const image = { required: true, type: 'image-url' };
const { scrape: canvasGoodbyeV2, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    username: { required: true, maxLength: 80 }, guildName: { required: true, maxLength: 100 },
    memberCount: { required: true, min: 0, max: 100000000 }, avatar: image, background: image
  }
});

module.exports = { canvasGoodbyeV2 };
if (require.main === module) cli();
