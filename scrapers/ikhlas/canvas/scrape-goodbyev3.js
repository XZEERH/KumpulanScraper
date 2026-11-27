#!/usr/bin/env node
'use strict';

/**
 * Name : Goodbye V3
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Membuat gambar ucapan perpisahan sederhana dan cepat hanya dengan input nama pengguna dan avatar.
 * Note : node scrapers/ikhlas/canvas/scrape-goodbyev3.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/canvas/goodbyev3';
const { scrape: ikhlasCanvasGoodbyev3, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  format: 'image',
  params: {
    username: { required: true },
    avatar: { required: true, url: true }
  }
});

module.exports = { ikhlasCanvasGoodbyev3 };
if (require.main === module) cli();
