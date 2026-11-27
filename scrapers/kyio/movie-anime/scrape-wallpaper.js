#!/usr/bin/env node
'use strict';

/**
 * Name : Anime Wallpaper Hub
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Dapatkan wallpaper anime berkualitas tinggi, Live2D, atau karya seni trending dari Hoyolab.
 * Note : node scrapers/kyio/movie-anime/scrape-wallpaper.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/wallpaper';
const { scrape: movieAnimeWallpaper, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    type: { required: true },
    q: {},
    game: {}
  }
});

module.exports = { movieAnimeWallpaper };
if (require.main === module) cli();
