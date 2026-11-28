#!/usr/bin/env node
'use strict';

/**
 * Name : Teka Teki
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan teka-teki misteri, tebak logika, dan pertanyaan unik yang menguji kecerdasan dan kreativitas berpikir.
 * Note : node scrapers/ikhlas/games/scrape-tekateki.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tekateki';
const { scrape: ikhlasGamesTekateki, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTekateki };
if (require.main === module) cli();
