#!/usr/bin/env node
'use strict';

/**
 * Name : Kompas News
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil headline dan artikel berita terbaru dari Kompas.com, portal berita terkemuka di Indonesia, mencakup informasi aktual seputar peristiwa nasional, politik, ekonomi, edukasi, dan isu penting lainnya.
 * Note : node scrapers/ikhlas/berita/scrape-kompas.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/berita/kompas';
const { scrape: ikhlasBeritaKompas, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasBeritaKompas };
if (require.main === module) cli();
