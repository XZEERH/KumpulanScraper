#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Level Up
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat kartu pemberitahuan perubahan level.
 * Note : node scrapers/siputzx/canvas/scrape-siputzx-canvas-level-up.js --name Demo --avatarURL "https://placehold.co/150x150.png" --backgroundURL "https://placehold.co/400x300.png" --fromLevel 0 --toLevel 1
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/level-up';
const image = { required: true, type: 'image-url' };
const level = { required: true, min: 0, max: 1000000 };
const { scrape: canvasLevelUp, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: { name: { required: true, maxLength: 80 }, avatarURL: image, backgroundURL: image, fromLevel: level, toLevel: level }
});

module.exports = { canvasLevelUp };
if (require.main === module) cli();
