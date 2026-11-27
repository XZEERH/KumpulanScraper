#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Download MP3/MP4
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fast response YouTube MP3 & MP4 media downloader with direct streaming tunnel.
 * Note : node scrapers/kyio/downloader/scrape-yt-fast.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/yt-fast';
const { scrape: downloaderYtFast, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    type: {}
  }
});

module.exports = { downloaderYtFast };
if (require.main === module) cli();
