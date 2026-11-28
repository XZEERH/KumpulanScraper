#!/usr/bin/env node
'use strict';

/**
 * Name : Apple Music Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download high-quality tracks and entire albums from Apple Music via URL.
 * Note : node scrapers/kyio/downloader/scrape-apple-music.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/apple-music';
const { scrape: downloaderAppleMusic, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderAppleMusic };
if (require.main === module) cli();
