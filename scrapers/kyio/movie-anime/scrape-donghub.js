#!/usr/bin/env node
'use strict';

/**
 * Name : Donghub Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for Donghua on Donghub and get details with episode list.
 * Note : node scrapers/kyio/movie-anime/scrape-donghub.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/donghub';
const { scrape: movieAnimeDonghub, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: { required: true },
    q: {},
    url: {}
  }
});

module.exports = { movieAnimeDonghub };
if (require.main === module) cli();
