#!/usr/bin/env node
'use strict';

/**
 * Name : Anime Search & Charts
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Explore anime details, search for your favorite series, or browse top charts (airing, upcoming, and more).
 * Note : node scrapers/kyio/movie-anime/scrape-myanimelist.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/myanimelist';
const { scrape: movieAnimeMyanimelist, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    type: { required: true },
    url: { required: true }
  }
});

module.exports = { movieAnimeMyanimelist };
if (require.main === module) cli();
