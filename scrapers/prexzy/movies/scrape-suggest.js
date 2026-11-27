#!/usr/bin/env node
'use strict';

/**
 * Name : Search Suggestions
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get search suggestions for a keyword
 * Note : node scrapers/prexzy/movies/scrape-suggest.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/suggest';
const { scrape: prexzyMoviesSuggest, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    q: { required: true }
  }
});

module.exports = { prexzyMoviesSuggest };
if (require.main === module) cli();
