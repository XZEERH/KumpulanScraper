#!/usr/bin/env node
'use strict';

/**
 * Name : Manwhaku Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari judul manga, manhwa, dan manhua di Manwhaku.
 * Note : node scrapers/kyio/movie-anime/scrape-manwhaku-search.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/manwhaku/search';
const { scrape: movieAnimeManwhakuSearch, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { movieAnimeManwhakuSearch };
if (require.main === module) cli();
