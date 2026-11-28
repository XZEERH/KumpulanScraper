#!/usr/bin/env node
'use strict';

/**
 * Name : Animeindo
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Nonton streaming anime subtitle Indonesia. Search, detail, daftar episode, stream server, dan link download (url_download) dari anime-indo.lol.
 * Note : node scrapers/kyio/movie-anime/scrape-animeindo.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/animeindo';
const { scrape: movieAnimeAnimeindo, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: { required: true },
    q: {},
    url: {},
    slug: {},
    page: {}
  }
});

module.exports = { movieAnimeAnimeindo };
if (require.main === module) cli();
