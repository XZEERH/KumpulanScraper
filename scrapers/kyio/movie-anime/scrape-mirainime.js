#!/usr/bin/env node
'use strict';

/**
 * Name : Mirainime
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Nonton streaming dan download anime subtitle Indonesia dari Mirainime (top anime, airing, jadwal, search, detail, stream MP4/HLS direct mirrors).
 * Note : node scrapers/kyio/movie-anime/scrape-mirainime.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/mirainime';
const { scrape: movieAnimeMirainime, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    q: {},
    slug: {},
    episode: {},
    genre: {},
    page: {}
  }
});

module.exports = { movieAnimeMirainime };
if (require.main === module) cli();
