#!/usr/bin/env node
'use strict';

/**
 * Name : Karakter Free Fire
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan deskripsi latar belakang dan kemampuan khusus (skill) karakter game Free Fire untuk ditebak nama karakternya.
 * Note : node scrapers/ikhlas/games/scrape-karakter-freefire.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/karakter-freefire';
const { scrape: ikhlasGamesKarakterFreefire, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesKarakterFreefire };
if (require.main === module) cli();
