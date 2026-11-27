#!/usr/bin/env node
'use strict';

/**
 * Name : Welcome V3
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar ucapan selamat datang yang sangat sederhana dan ringan hanya membutuhkan teks nama pengguna dan avatar.
 * Note : node scrapers/ikhlas/canvas/scrape-welcomev3.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/welcomev3';
const { scrape: ikhlasCanvasWelcomev3, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    username: { required: true },
    avatar: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasWelcomev3 };
if (require.main === module) cli();
