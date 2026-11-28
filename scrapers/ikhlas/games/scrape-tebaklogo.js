#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Logo
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan URL gambar logo produk, perusahaan, atau organisasi global maupun nasional untuk ditebak nama mereknya.
 * Note : node scrapers/ikhlas/games/scrape-tebaklogo.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebaklogo';
const { scrape: ikhlasGamesTebaklogo, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebaklogo };
if (require.main === module) cli();
