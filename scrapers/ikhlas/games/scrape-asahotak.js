#!/usr/bin/env node
'use strict';

/**
 * Name : Asah Otak
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Kumpulan pertanyaan asah otak berkualitas tinggi yang dirancang untuk menguji kecermatan penalaran dan pengetahuan umum.
 * Note : node scrapers/ikhlas/games/scrape-asahotak.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/asahotak';
const { scrape: ikhlasGamesAsahotak, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesAsahotak };
if (require.main === module) cli();
