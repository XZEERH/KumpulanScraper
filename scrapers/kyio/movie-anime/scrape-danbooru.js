#!/usr/bin/env node
'use strict';

/**
 * Name : Danbooru Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari gambar dan metadata dari Danbooru berdasarkan tag.
 * Note : node scrapers/kyio/movie-anime/scrape-danbooru.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/danbooru';
const { scrape: movieAnimeDanbooru, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    rating: {},
    limit: {}
  }
});

module.exports = { movieAnimeDanbooru };
if (require.main === module) cli();
