#!/usr/bin/env node
'use strict';

/**
 * Name : Country Codes
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get list of available country codes
 * Note : node scrapers/prexzy/movies/scrape-countries.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/countries';
const { scrape: prexzyMoviesCountries, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy'
});

module.exports = { prexzyMoviesCountries };
if (require.main === module) cli();
