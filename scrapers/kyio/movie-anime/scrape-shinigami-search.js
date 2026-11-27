#!/usr/bin/env node
'use strict';

/**
 * Name : Shinigami Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for manga on shngm.io with organic results.
 * Note : node scrapers/kyio/movie-anime/scrape-shinigami-search.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/shinigami/search';
const { scrape: movieAnimeShinigamiSearch, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { movieAnimeShinigamiSearch };
if (require.main === module) cli();
