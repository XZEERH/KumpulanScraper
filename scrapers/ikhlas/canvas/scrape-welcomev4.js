#!/usr/bin/env node
'use strict';

/**
 * Name : Welcome V4
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat banner ucapan selamat datang bergaya modern Canvafy dengan avatar, latar belakang, dan deskripsi sambutan.
 * Note : node scrapers/ikhlas/canvas/scrape-welcomev4.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/welcomev4';
const { scrape: ikhlasCanvasWelcomev4, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    avatar: { required: true, url: true },
    background: { required: true, url: true },
    description: { required: true }
  }
});

module.exports = { ikhlasCanvasWelcomev4 };
if (require.main === module) cli();
