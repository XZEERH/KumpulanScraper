#!/usr/bin/env node
'use strict';

/**
 * Name : Ship Image
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat visualisasi kartu persentase kecocokan cinta dari dua avatar dengan latar kustom dan angka persentase.
 * Note : node scrapers/ikhlas/canvas/scrape-ship.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/ship';
const { scrape: ikhlasCanvasShip, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    avatar1: { required: true, url: true },
    avatar2: { required: true, url: true },
    background: { required: true, url: true },
    persen: { required: true }
  }
});

module.exports = { ikhlasCanvasShip };
if (require.main === module) cli();
