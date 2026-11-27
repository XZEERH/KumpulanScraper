#!/usr/bin/env node
'use strict';

/**
 * Name : Sindonews
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan akses ke headline berita terbaru dari Sindonews.com mencakup berita nasional, metropolitan, ekonomi, tekno, sains, dan kabar internasional.
 * Note : node scrapers/ikhlas/berita/scrape-sindonews.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/berita/sindonews';
const { scrape: ikhlasBeritaSindonews, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasBeritaSindonews };
if (require.main === module) cli();
