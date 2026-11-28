#!/usr/bin/env node
'use strict';

/**
 * Name : CNBC Indonesia
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil headline berita terbaru dari CNBC Indonesia dengan fokus berita bisnis dan keuangan, mencakup judul, URL, gambar terkait, kategori, label khusus seperti Live jika ada, dan tanggal publikasi, serta mengelompokkan konten sebagai video atau artikel berdasarkan sumbernya.
 * Note : node scrapers/ikhlas/berita/scrape-cnbcindonesia.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/berita/cnbcindonesia';
const { scrape: ikhlasBeritaCnbcindonesia, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasBeritaCnbcindonesia };
if (require.main === module) cli();
