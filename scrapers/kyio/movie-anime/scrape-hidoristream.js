#!/usr/bin/env node
'use strict';

/**
 * Name : HidoriStream
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Nonton streaming anime subtitle Indonesia dari HidoriStream. Lengkap dengan pencarian, info anime, daftar episode, multi-server embed mirror, dan direct link download (Google Drive, Terabox, Telegram).
 * Note : node scrapers/kyio/movie-anime/scrape-hidoristream.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/anime/hidoristream';
const { scrape: movieAnimeHidoristream, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    q: {},
    slug: {},
    url: {},
    episode: {},
    page: {}
  }
});

module.exports = { movieAnimeHidoristream };
if (require.main === module) cli();
