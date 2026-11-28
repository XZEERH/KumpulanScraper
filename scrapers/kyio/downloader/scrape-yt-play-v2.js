#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Play V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fast YouTube Music Downloader and Search.
 * Note : node scrapers/kyio/downloader/scrape-yt-play-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/yt-play-v2';
const { scrape: downloaderYtPlayV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderYtPlayV2 };
if (require.main === module) cli();
