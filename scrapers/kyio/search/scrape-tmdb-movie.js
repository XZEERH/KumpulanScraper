#!/usr/bin/env node
'use strict';

/**
 * Name : TMDB Movie Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for movies on TMDB database.
 * Note : node scrapers/kyio/search/scrape-tmdb-movie.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/tmdb-movie';
const { scrape: searchTmdbMovie, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    apikey: { required: true }
  }
});

module.exports = { searchTmdbMovie };
if (require.main === module) cli();
