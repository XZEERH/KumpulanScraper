#!/usr/bin/env node
'use strict';

/**
 * Name : Anichin Donghua
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Nonton streaming dan download donghua subtitle Indonesia terlengkap dari anichin.moe (homepage, rilis terbaru, filter genre, stream mirrors terdekripsi, download links).
 * Note : node scrapers/kyio/movie-anime/scrape-anichin.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/anichin';
const { scrape: movieAnimeAnichin, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    q: {},
    url: {},
    page: {}
  }
});

module.exports = { movieAnimeAnichin };
if (require.main === module) cli();
