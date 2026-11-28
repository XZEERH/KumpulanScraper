#!/usr/bin/env node
'use strict';

/**
 * Name : Waifu Gallery
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Dapatkan gambar anime (waifu, neko, maid, dll) berkualitas tinggi secara instan.
 * Note : node scrapers/kyio/movie-anime/scrape-waifu-gallery.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/waifu-gallery';
const { scrape: movieAnimeWaifuGallery, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    tag: {},
    raw: {}
  }
});

module.exports = { movieAnimeWaifuGallery };
if (require.main === module) cli();
