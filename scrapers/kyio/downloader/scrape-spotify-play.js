#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Play
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fast response Spotify search and direct MP3 audio streaming download.
 * Note : node scrapers/kyio/downloader/scrape-spotify-play.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/dl/spotify-play';
const { scrape: downloaderSpotifyPlay, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderSpotifyPlay };
if (require.main === module) cli();
