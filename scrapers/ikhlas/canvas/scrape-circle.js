#!/usr/bin/env node
'use strict';

/**
 * Name : Circle Image
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Memotong dan menerapkan masker bentuk lingkaran sempurna pada gambar input secara otomatis.
 * Note : node scrapers/ikhlas/canvas/scrape-circle.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/circle';
const { scrape: ikhlasCanvasCircle, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasCircle };
if (require.main === module) cli();
