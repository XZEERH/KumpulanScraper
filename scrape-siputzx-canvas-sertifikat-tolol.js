#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Sertifikat Parodi
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Merender sertifikat meme dengan teks kustom, bukan dokumen resmi.
 * Note : node scrape-siputzx-canvas-sertifikat-tolol.js --text DEMO
 */

const { imageEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/sertifikat-tolol';
const { scrape: canvasSertifikatParodi, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { text: { required: true, maxLength: 100 } }
});

module.exports = { canvasSertifikatParodi };
if (require.main === module) cli();
