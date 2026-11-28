#!/usr/bin/env node
'use strict';

/**
 * Name : Darkness Image Effect
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menerapkan filter penggelapan intensitas pada gambar dengan parameter tingkat kegelapan yang dapat diatur.
 * Note : node scrapers/ikhlas/canvas/scrape-darkness.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/darkness';
const { scrape: ikhlasCanvasDarkness, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image: { required: true, url: true },
    amount: {}
  }
});

module.exports = { ikhlasCanvasDarkness };
if (require.main === module) cli();
