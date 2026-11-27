#!/usr/bin/env node
'use strict';

/**
 * Name : Anime Home
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get homepage anime TV listing
 * Note : node scrapers/prexzy/anime/scrape-animekill-home.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/anime/animekill-home';
const { scrape: prexzyAnimeAnimekillHome, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  field: 'data'
});

module.exports = { prexzyAnimeAnimekillHome };
if (require.main === module) cli();
