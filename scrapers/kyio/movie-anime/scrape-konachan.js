#!/usr/bin/env node
'use strict';

/**
 * Name : Konachan Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari gambar anime dari Konachan dengan dukungan filter rating (safe/explicit).
 * Note : node scrapers/kyio/movie-anime/scrape-konachan.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/konachan';
const { scrape: movieAnimeKonachan, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    rating: {},
    limit: {}
  }
});

module.exports = { movieAnimeKonachan };
if (require.main === module) cli();
