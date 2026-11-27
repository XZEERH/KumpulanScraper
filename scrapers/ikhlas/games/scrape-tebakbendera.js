#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Bendera
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan emoji bendera atau simbol kebangsaan resmi negara dunia untuk ditebak nama negaranya.
 * Note : node scrapers/ikhlas/games/scrape-tebakbendera.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebakbendera';
const { scrape: ikhlasGamesTebakbendera, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebakbendera };
if (require.main === module) cli();
