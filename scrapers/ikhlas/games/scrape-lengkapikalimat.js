#!/usr/bin/env node
'use strict';

/**
 * Name : Lengkapi Kalimat
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan soal rumpang kalimat acak dalam Bahasa Indonesia yang harus dilengkapi dengan kata yang tepat dan logis.
 * Note : node scrapers/ikhlas/games/scrape-lengkapikalimat.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/lengkapikalimat';
const { scrape: ikhlasGamesLengkapikalimat, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesLengkapikalimat };
if (require.main === module) cli();
