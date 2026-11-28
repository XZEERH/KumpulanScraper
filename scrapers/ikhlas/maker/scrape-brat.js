#!/usr/bin/env node
'use strict';

/**
 * Name : Brat Generator
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar typography minimalis modern bergaya Brat warna hijau khas dari teks input. Mendukung mode animasi GIF per kata dengan kustomisasi jeda waktu delay antar kata.
 * Note : node scrapers/ikhlas/maker/scrape-brat.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/maker/brat';
const { scrape: ikhlasMakerBrat, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    text: { required: true },
    isAnimated: {},
    delay: {}
  }
});

module.exports = { ikhlasMakerBrat };
if (require.main === module) cli();
