#!/usr/bin/env node
'use strict';

/**
 * Name : Kiss Image
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar meme ciuman romantis/komikal dengan menyatukan dua gambar avatar pengguna.
 * Note : node scrapers/ikhlas/canvas/scrape-kiss.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/kiss';
const { scrape: ikhlasCanvasKiss, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image1: { required: true, url: true },
    image2: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasKiss };
if (require.main === module) cli();
