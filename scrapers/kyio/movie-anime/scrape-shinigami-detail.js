#!/usr/bin/env node
'use strict';

/**
 * Name : Shinigami Detail
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get manga info and chapter list from shngm.io.
 * Note : node scrapers/kyio/movie-anime/scrape-shinigami-detail.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/shinigami/detail';
const { scrape: movieAnimeShinigamiDetail, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    id: { required: true }
  }
});

module.exports = { movieAnimeShinigamiDetail };
if (require.main === module) cli();
