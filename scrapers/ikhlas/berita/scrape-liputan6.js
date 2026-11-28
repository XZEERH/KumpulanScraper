#!/usr/bin/env node
'use strict';

/**
 * Name : Liputan6
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil headline berita terbaru dari Liputan6.com mengenai peristiwa terkini, berita nasional, gaya hidup, perkembangan teknologi, otomotif, kabar viral, dan hiburan.
 * Note : node scrapers/ikhlas/berita/scrape-liputan6.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/berita/liputan6';
const { scrape: ikhlasBeritaLiputan6, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasBeritaLiputan6 };
if (require.main === module) cli();
