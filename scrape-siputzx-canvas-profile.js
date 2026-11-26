#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Profile Card
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat kartu profil dari avatar, latar, level, dan pengalaman.
 * Note : node scrape-siputzx-canvas-profile.js --name Demo --backgroundURL "https://placehold.co/400x300.png" --avatarURL "https://placehold.co/150x150.png" --rankName Bronze --rankId 0 --exp 500 --requireExp 1000 --level 3
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/profile';
const image = { required: true, type: 'image-url' };
const { scrape: canvasProfile, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    name: { required: true, maxLength: 80 }, avatarURL: image, backgroundURL: image,
    rankName: { required: true, maxLength: 60 }, rankId: { required: true, maxLength: 30 },
    exp: { required: true, min: 0, max: 100000000 }, requireExp: { required: true, min: 1, max: 100000000 },
    level: { required: true, min: 0, max: 1000000 }
  }
});

module.exports = { canvasProfile };
if (require.main === module) cli();
