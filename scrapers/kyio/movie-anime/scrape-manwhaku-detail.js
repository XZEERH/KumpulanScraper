#!/usr/bin/env node
'use strict';

/**
 * Name : Manwhaku Detail
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Dapatkan detail lengkap sinopsis, author, genre, rating, dan daftar chapter dari Manwhaku.
 * Note : node scrapers/kyio/movie-anime/scrape-manwhaku-detail.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/manwhaku/detail';
const { scrape: movieAnimeManwhakuDetail, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    slug: { required: true }
  }
});

module.exports = { movieAnimeManwhakuDetail };
if (require.main === module) cli();
