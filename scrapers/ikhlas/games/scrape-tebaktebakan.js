#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Tebakan
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyediakan humor tebak-tebakan kata santai yang menghibur untuk mencairkan suasana dan bermain bersama kawan.
 * Note : node scrapers/ikhlas/games/scrape-tebaktebakan.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebaktebakan';
const { scrape: ikhlasGamesTebaktebakan, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebaktebakan };
if (require.main === module) cli();
