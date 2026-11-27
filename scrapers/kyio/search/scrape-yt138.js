#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Search V3
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Quickly search for videos, channels, and playlists on YouTube.
 * Note : node scrapers/kyio/search/scrape-yt138.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/yt138';
const { scrape: searchYt138, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchYt138 };
if (require.main === module) cli();
