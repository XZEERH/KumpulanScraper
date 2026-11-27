#!/usr/bin/env node
'use strict';

/**
 * Name : Anime Genres
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get list of all available genres
 * Note : node scrapers/prexzy/anime/scrape-animekill-genres.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/anime/animekill-genres';
const { scrape: prexzyAnimeAnimekillGenres, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  field: 'data'
});

module.exports = { prexzyAnimeAnimekillGenres };
if (require.main === module) cli();
