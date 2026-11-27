#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Kalimat
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan soal tebakan kalimat atau peribahasa acak yang membutuhkan jawaban kata kunci yang sesuai.
 * Note : node scrapers/ikhlas/games/scrape-tebakkalimat.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebakkalimat';
const { scrape: ikhlasGamesTebakkalimat, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebakkalimat };
if (require.main === module) cli();
