#!/usr/bin/env node
'use strict';

/**
 * Name : Music Card
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/canvas
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Generate a music card with song title, artist name, and user image
 * Note : node scrapers/nexray/canvas/scrape-musiccard.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/canvas/musiccard';
const { scrape: nexrayCanvasMusiccard, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    judul: { required: true },
    nama: { required: true },
    image_url: { required: true, url: true }
  }
});

module.exports = { nexrayCanvasMusiccard };
if (require.main === module) cli();
