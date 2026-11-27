#!/usr/bin/env node
'use strict';

/**
 * Name : Manwhaku Unified API
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari komik, dapatkan detail & daftar chapter, dan ekstrak gambar reader dari Manwhaku.
 * Note : node scrapers/kyio/movie-anime/scrape-manwhaku.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/manwhaku';
const { scrape: movieAnimeManwhaku, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: {},
    action: {},
    slug: {},
    ch: {}
  }
});

module.exports = { movieAnimeManwhaku };
if (require.main === module) cli();
