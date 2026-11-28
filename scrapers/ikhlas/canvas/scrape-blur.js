#!/usr/bin/env node
'use strict';

/**
 * Name : Blur Image Effect
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menerapkan filter blur artistik pada gambar input dengan kelembutan transisi piksel yang merata.
 * Note : node scrapers/ikhlas/canvas/scrape-blur.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/blur';
const { scrape: ikhlasCanvasBlur, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasBlur };
if (require.main === module) cli();
