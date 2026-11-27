#!/usr/bin/env node
'use strict';

/**
 * Name : Shinigami Manga Reader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Baca dan jelajahi manga, manhwa, dan manhua subtitle Indonesia dari Shinigami (s1.shinigami.mx).
 * Note : node scrapers/kyio/movie-anime/scrape-shinigami.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/shinigami';
const { scrape: movieAnimeShinigami, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    q: {},
    id: {},
    page: {},
    pageSize: {}
  }
});

module.exports = { movieAnimeShinigami };
if (require.main === module) cli();
