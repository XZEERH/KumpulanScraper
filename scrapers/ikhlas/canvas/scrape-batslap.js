#!/usr/bin/env node
'use strict';

/**
 * Name : Batslap Image
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar meme tampar ikonik Batman dan Robin dengan menggabungkan dua gambar avatar pengguna pada posisi Batman dan Robin.
 * Note : node scrapers/ikhlas/canvas/scrape-batslap.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/batslap';
const { scrape: ikhlasCanvasBatslap, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    image1: { required: true, url: true },
    image2: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasBatslap };
if (require.main === module) cli();
