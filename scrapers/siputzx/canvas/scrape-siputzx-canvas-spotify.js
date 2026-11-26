#!/usr/bin/env node
'use strict';

/**
 * Name : Canvas Spotify Card
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Membuat kartu lagu dengan judul, artis, gambar, dan durasi dalam milidetik.
 * Note : node scrapers/siputzx/canvas/scrape-siputzx-canvas-spotify.js --title "Demo Track" --artist "Demo Artist" --start 15000 --end 200000 --image "https://placehold.co/150x150.png"
 */

const { imageEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/canvas/spotify';
const { scrape: canvasSpotify, cli } = imageEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000,
  params: {
    title: { required: true, maxLength: 120 }, artist: { required: true, maxLength: 120 },
    start: { required: true, min: 0, max: 86400000 }, end: { required: true, min: 1, max: 86400000 },
    image: { required: true, type: 'image-url' }, album: { maxLength: 120 }, border: { pattern: /^#[\da-f]{6}$/i }
  }
});

module.exports = { canvasSpotify };
if (require.main === module) cli();
