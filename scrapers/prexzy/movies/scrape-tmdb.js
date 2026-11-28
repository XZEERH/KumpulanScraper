#!/usr/bin/env node
'use strict';

/**
 * Name : TMDB
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : The Movie Database API - Search, discover, and get details for movies and TV shows
 * Note : node scrapers/prexzy/movies/scrape-tmdb.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/anime/tmdb';
const { scrape: prexzyMoviesTmdb, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  field: 'result',
  params: {
    action: { required: true },
    query: {},
    id: {},
    type: {},
    limit: {},
    season: {},
    episode: {}
  }
});

module.exports = { prexzyMoviesTmdb };
if (require.main === module) cli();
