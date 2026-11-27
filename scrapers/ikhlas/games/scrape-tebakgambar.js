#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Gambar
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan gambar teka-teki visual kreatif yang menggabungkan potongan ilustrasi menjadi frasa kosakata baru.
 * Note : node scrapers/ikhlas/games/scrape-tebakgambar.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebakgambar';
const { scrape: ikhlasGamesTebakgambar, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebakgambar };
if (require.main === module) cli();
