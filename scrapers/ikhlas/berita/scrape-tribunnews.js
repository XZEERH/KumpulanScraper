#!/usr/bin/env node
'use strict';

/**
 * Name : Tribunnews
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil headline berita terbaru dari Tribunnews.com, portal berita jaringan Kompas Gramedia dengan liputan luas nusantara, mencakup judul, tautan langsung ke artikel lengkap, gambar thumbnail, dan waktu publikasi.
 * Note : node scrapers/ikhlas/berita/scrape-tribunnews.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/berita/tribunnews';
const { scrape: ikhlasBeritaTribunnews, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasBeritaTribunnews };
if (require.main === module) cli();
