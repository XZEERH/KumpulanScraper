#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Community Slide Downloader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download high-resolution image slides from YouTube community posts via studioseo.tools.
 * Note : node scrapers/kyio/downloader/scrape-ytslide.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/ytslide';
const { scrape: downloaderYtslide, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderYtslide };
if (require.main === module) cli();
