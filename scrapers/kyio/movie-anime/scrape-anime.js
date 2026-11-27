#!/usr/bin/env node
'use strict';

/**
 * Name : Anime Quotes
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get random anime quotes with character and anime info from OtakOtaku.
 * Note : node scrapers/kyio/movie-anime/scrape-anime.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/quotes/anime';
const { scrape: movieAnimeAnime, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { movieAnimeAnime };
if (require.main === module) cli();
