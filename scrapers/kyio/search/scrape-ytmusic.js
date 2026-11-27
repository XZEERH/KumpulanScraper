#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Music Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for music and song suggestions on YouTube Music.
 * Note : node scrapers/kyio/search/scrape-ytmusic.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/ytmusic';
const { scrape: searchYtmusic, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchYtmusic };
if (require.main === module) cli();
