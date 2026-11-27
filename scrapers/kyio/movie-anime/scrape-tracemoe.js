#!/usr/bin/env node
'use strict';

/**
 * Name : Anime Search via Image
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari judul anime, episode, dan timestamp hanya dengan mengunggah gambar atau memberikan URL adegan anime.
 * Note : node scrapers/kyio/movie-anime/scrape-tracemoe.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tracemoe';
const { scrape: movieAnimeTracemoe, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { movieAnimeTracemoe };
if (require.main === module) cli();
