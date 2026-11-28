#!/usr/bin/env node
'use strict';

/**
 * Name : SakuraNovel
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Read light novels with search, detail, and chapter support.
 * Note : node scrapers/kyio/movie-anime/scrape-sakuranovel.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/sakuranovel';
const { scrape: movieAnimeSakuranovel, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: { required: true },
    q: { required: true },
    url: { required: true }
  }
});

module.exports = { movieAnimeSakuranovel };
if (require.main === module) cli();
