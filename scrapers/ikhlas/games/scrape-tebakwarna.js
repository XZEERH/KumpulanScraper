#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Warna
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan visual pelat titik warna untuk menguji ketajaman visual dan persepsi warna pengguna.
 * Note : node scrapers/ikhlas/games/scrape-tebakwarna.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebakwarna';
const { scrape: ikhlasGamesTebakwarna, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebakwarna };
if (require.main === module) cli();
