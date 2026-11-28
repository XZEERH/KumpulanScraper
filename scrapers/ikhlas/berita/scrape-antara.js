#!/usr/bin/env node
'use strict';

/**
 * Name : Antara News
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil headline dan artikel berita terbaru dari Antara News, salah satu kantor berita terkemuka di Indonesia, diambil dari bagian Editor Picks, mencakup judul artikel, tautan, gambar terkait, kategori, dan penanda apakah konten berupa infografis atau artikel biasa.
 * Note : node scrapers/ikhlas/berita/scrape-antara.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/berita/antara';
const { scrape: ikhlasBeritaAntara, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasBeritaAntara };
if (require.main === module) cli();
