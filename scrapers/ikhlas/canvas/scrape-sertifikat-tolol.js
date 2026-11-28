#!/usr/bin/env node
'use strict';

/**
 * Name : Sertifikat Tolol
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar sertifikat lucu dan parodi dengan teks kustom yang dapat Anda tentukan sendiri.
 * Note : node scrapers/ikhlas/canvas/scrape-sertifikat-tolol.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/sertifikat-tolol';
const { scrape: ikhlasCanvasSertifikatTolol, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    text: { required: true }
  }
});

module.exports = { ikhlasCanvasSertifikatTolol };
if (require.main === module) cli();
