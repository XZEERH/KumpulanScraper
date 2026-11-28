#!/usr/bin/env node
'use strict';

/**
 * Name : Susun Kata
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan huruf-huruf yang teracak beserta petunjuk kategori/tipe kata untuk disusun kembali menjadi kata Bahasa Indonesia yang benar.
 * Note : node scrapers/ikhlas/games/scrape-susunkata.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/susunkata';
const { scrape: ikhlasGamesSusunkata, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesSusunkata };
if (require.main === module) cli();
