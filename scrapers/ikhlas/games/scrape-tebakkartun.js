#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Kartun
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan gambar karakter animasi kartun klasik maupun modern dari berbagai serial animasi dunia untuk ditebak namanya.
 * Note : node scrapers/ikhlas/games/scrape-tebakkartun.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebakkartun';
const { scrape: ikhlasGamesTebakkartun, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebakkartun };
if (require.main === module) cli();
