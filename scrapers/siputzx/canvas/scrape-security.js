#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Security Card
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Merender kartu bertema keamanan dari avatar dan stempel waktu demo.
 * Note : node scrapers/siputzx/canvas/scrape-security.js --avatar "https://placehold.co/150x150.png" --background "https://placehold.co/400x300.png" --createdTimestamp 1672531200000 --suspectTimestamp 604800000 --locale en
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/security';
const image = { required: true, type: 'image-url' };
const time = { required: true, min: 0, max: 8640000000000000 };
const { scrape: canvasSecurity, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    avatar: image, background: image, createdTimestamp: time, suspectTimestamp: time,
    locale: { required: true, pattern: /^[a-z]{2,3}(?:-[a-z]{2,4})?$/i }
  }
});

module.exports = { canvasSecurity };
if (require.main === module) cli();
