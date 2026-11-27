#!/usr/bin/env node
'use strict';

/**
 * Name : Nanime ID
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Streaming and catalog API for Nanime ID (latest episodes, search, streaming m3u8 direct links, genres, schedule).
 * Note : node scrapers/kyio/movie-anime/scrape-nanime.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/nanime';
const { scrape: movieAnimeNanime, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    q: {},
    id: {},
    genre: {},
    letter: {},
    mode: {},
    page: {},
    limit: {}
  }
});

module.exports = { movieAnimeNanime };
if (require.main === module) cli();
