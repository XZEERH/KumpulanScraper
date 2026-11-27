#!/usr/bin/env node
'use strict';

/**
 * Name : Character Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search detailed information about anime characters.
 * Note : node scrapers/kyio/movie-anime/scrape-character.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/character';
const { scrape: movieAnimeCharacter, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { movieAnimeCharacter };
if (require.main === module) cli();
