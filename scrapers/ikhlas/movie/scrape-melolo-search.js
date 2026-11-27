#!/usr/bin/env node
'use strict';

/**
 * Name : Melolo Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mencari judul drama pendek di platform Melolo berdasarkan kata kunci dengan dukungan offset dan limit.
 * Note : node scrapers/ikhlas/movie/scrape-melolo-search.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/movie/melolo/search';
const { scrape: ikhlasMovieMeloloSearch, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'data',
  params: {
    query: { required: true },
    offset: {},
    limit: {}
  }
});

module.exports = { ikhlasMovieMeloloSearch };
if (require.main === module) cli();
