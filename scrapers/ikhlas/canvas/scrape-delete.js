#!/usr/bin/env node
'use strict';

/**
 * Name : Delete Meme
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar meme dialog Recycle Bin Windows yang membuang gambar yang dipilih pengguna.
 * Note : node scrapers/ikhlas/canvas/scrape-delete.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/delete';
const { scrape: ikhlasCanvasDelete, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasDelete };
if (require.main === module) cli();
