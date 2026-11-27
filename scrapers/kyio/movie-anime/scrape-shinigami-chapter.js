#!/usr/bin/env node
'use strict';

/**
 * Name : Shinigami Chapter
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch images for a manga chapter from shngm.io.
 * Note : node scrapers/kyio/movie-anime/scrape-shinigami-chapter.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/manga/shinigami/chapter';
const { scrape: movieAnimeShinigamiChapter, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    id: { required: true }
  }
});

module.exports = { movieAnimeShinigamiChapter };
if (require.main === module) cli();
