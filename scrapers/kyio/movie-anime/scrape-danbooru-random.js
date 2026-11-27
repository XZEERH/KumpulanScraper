#!/usr/bin/env node
'use strict';

/**
 * Name : Danbooru Random
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Mengambil gambar acak secara langsung dari database Danbooru.
 * Note : node scrapers/kyio/movie-anime/scrape-danbooru-random.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/danbooru-random';
const { scrape: movieAnimeDanbooruRandom, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    limit: {}
  }
});

module.exports = { movieAnimeDanbooruRandom };
if (require.main === module) cli();
