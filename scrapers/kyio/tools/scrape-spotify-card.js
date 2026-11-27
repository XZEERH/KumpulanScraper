#!/usr/bin/env node
'use strict';

/**
 * Name : Spotify Card Generator
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate Spotify music playing card image.
 * Note : node scrapers/kyio/tools/scrape-spotify-card.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/spotify-card';
const { scrape: toolsSpotifyCard, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    title: { required: true },
    artist: { required: true },
    cover: { required: true }
  }
});

module.exports = { toolsSpotifyCard };
if (require.main === module) cli();
