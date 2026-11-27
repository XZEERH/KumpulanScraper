#!/usr/bin/env node
'use strict';

/**
 * Name : LK21 Movie
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for movies, get details, download links, and stream sources from LK21.
 * Note : node scrapers/kyio/movie-anime/scrape-lk21.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/movie/lk21';
const { scrape: movieAnimeLk21, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    q: {},
    slug: {},
    page: {}
  }
});

module.exports = { movieAnimeLk21 };
if (require.main === module) cli();
