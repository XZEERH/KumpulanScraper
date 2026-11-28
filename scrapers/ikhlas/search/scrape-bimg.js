#!/usr/bin/env node
'use strict';

/**
 * Name : Bing Image Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Temukan foto, wallpaper, ilustrasi, dan aset visual beresolusi tinggi dengan metadata dimensi dari mesin pencari Bing.
 * Note : node scrapers/ikhlas/search/scrape-bimg.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/search/bimg';
const { scrape: ikhlasSearchBimg, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasSearchBimg };
if (require.main === module) cli();
