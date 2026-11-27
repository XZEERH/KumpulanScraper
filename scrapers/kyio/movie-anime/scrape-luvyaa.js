#!/usr/bin/env node
'use strict';

/**
 * Name : Luvyaa Manga Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari manhwa/manga dan ambil detail beserta daftar chapter dari luvyaa.
 * Note : node scrapers/kyio/movie-anime/scrape-luvyaa.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/luvyaa';
const { scrape: movieAnimeLuvyaa, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { movieAnimeLuvyaa };
if (require.main === module) cli();
