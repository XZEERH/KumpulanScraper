#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Eksplorasi ide kreatif, konsep desain, fotografi estetis, dan inspirasi visual langsung dari komunitas Pinterest.
 * Note : node scrapers/ikhlas/search/scrape-pinterest.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/pinterest';
const { scrape: ikhlasSearchPinterest, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasSearchPinterest };
if (require.main === module) cli();
