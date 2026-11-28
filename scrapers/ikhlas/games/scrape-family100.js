#!/usr/bin/env node
'use strict';

/**
 * Name : Family 100
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan pertanyaan survei publik beserta daftar jawaban teratas berskala poin yang terinspirasi dari kuis Family 100 / Family Feud.
 * Note : node scrapers/ikhlas/games/scrape-family100.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/family100';
const { scrape: ikhlasGamesFamily100, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesFamily100 };
if (require.main === module) cli();
