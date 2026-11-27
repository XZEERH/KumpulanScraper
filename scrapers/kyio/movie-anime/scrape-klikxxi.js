#!/usr/bin/env node
'use strict';

/**
 * Name : KlikXXI Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for any movie or TV series on KlikXXI and get results with details.
 * Note : node scrapers/kyio/movie-anime/scrape-klikxxi.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/movie/klikxxi';
const { scrape: movieAnimeKlikxxi, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    q: {},
    url: {}
  }
});

module.exports = { movieAnimeKlikxxi };
if (require.main === module) cli();
