#!/usr/bin/env node
'use strict';

/**
 * Name : Beautiful Image Effect
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar meme "This is beautiful" dari adegan Gravity Falls yang memamerkan gambar pengguna di dalam bingkai lukisan.
 * Note : node scrapers/ikhlas/canvas/scrape-beautiful.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/beautiful';
const { scrape: ikhlasCanvasBeautiful, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasBeautiful };
if (require.main === module) cli();
