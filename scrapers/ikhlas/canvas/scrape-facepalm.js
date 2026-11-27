#!/usr/bin/env node
'use strict';

/**
 * Name : Facepalm Image
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menerapkan overlay efek tepuk dahi (facepalm) lucu pada foto target untuk keperluan stiker atau meme.
 * Note : node scrapers/ikhlas/canvas/scrape-facepalm.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/facepalm';
const { scrape: ikhlasCanvasFacepalm, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasFacepalm };
if (require.main === module) cli();
