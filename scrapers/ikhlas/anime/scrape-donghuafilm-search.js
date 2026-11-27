#!/usr/bin/env node
'use strict';

/**
 * Name : DonghuaFilm Search
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mencari serial animasi donghua berdasarkan kata kunci dengan filter genre dan status penayangan.
 * Note : node scrapers/ikhlas/anime/scrape-donghuafilm-search.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/anime/donghuafilm-search';
const { scrape: ikhlasAnimeDonghuafilmSearch, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true },
    page: {}
  }
});

module.exports = { ikhlasAnimeDonghuafilmSearch };
if (require.main === module) cli();
