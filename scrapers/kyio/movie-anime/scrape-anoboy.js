#!/usr/bin/env node
'use strict';

/**
 * Name : Anoboy Anime Stream
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Primary anime streaming & download platform. Nonton streaming anime subtitle Indonesia, direct video stream (Blogger / YourUpload), multi-kualitas download (Gofile, Mp4Upload, Mirrored), jadwal rilis mingguan, genre filter, dan arsip episode lengkap dari Anoboy.
 * Note : node scrapers/kyio/movie-anime/scrape-anoboy.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/anoboy';
const { scrape: movieAnimeAnoboy, cli } = httpEndpoint(ENDPOINT, {
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

module.exports = { movieAnimeAnoboy };
if (require.main === module) cli();
