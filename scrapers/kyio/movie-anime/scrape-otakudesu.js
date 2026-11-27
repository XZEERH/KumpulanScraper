#!/usr/bin/env node
'use strict';

/**
 * Name : Otakudesu
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search anime, get detailed info, episode list, and stream links from Otakudesu.
 * Note : node scrapers/kyio/movie-anime/scrape-otakudesu.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/otakudesu';
const { scrape: movieAnimeOtakudesu, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    q: {},
    slug: {},
    page: {}
  }
});

module.exports = { movieAnimeOtakudesu };
if (require.main === module) cli();
