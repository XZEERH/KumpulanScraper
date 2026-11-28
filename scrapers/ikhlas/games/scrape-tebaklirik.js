#!/usr/bin/env node
'use strict';

/**
 * Name : Tebak Lirik
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menyajikan bait lirik lagu populer Indonesia atau mancanegara untuk ditebak judul lagunya.
 * Note : node scrapers/ikhlas/games/scrape-tebaklirik.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/games/tebaklirik';
const { scrape: ikhlasGamesTebaklirik, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result'
});

module.exports = { ikhlasGamesTebaklirik };
if (require.main === module) cli();
