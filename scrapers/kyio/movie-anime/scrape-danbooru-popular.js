#!/usr/bin/env node
'use strict';

/**
 * Name : Danbooru Popular
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Menampilkan gambar populer di Danbooru.
 * Note : node scrapers/kyio/movie-anime/scrape-danbooru-popular.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/danbooru-popular';
const { scrape: movieAnimeDanbooruPopular, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    scale: {}
  }
});

module.exports = { movieAnimeDanbooruPopular };
if (require.main === module) cli();
