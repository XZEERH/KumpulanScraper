#!/usr/bin/env node
'use strict';

/**
 * Name : Affect Image
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar meme template dokter "No it doesn't affect my baby" dari foto yang diberikan.
 * Note : node scrapers/ikhlas/canvas/scrape-affect.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/affect';
const { scrape: ikhlasCanvasAffect, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasAffect };
if (require.main === module) cli();
