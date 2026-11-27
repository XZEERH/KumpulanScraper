#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download video and image content from Pinterest by providing the pin URL.
 * Note : node scrapers/kyio/downloader/scrape-pinterest.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/pinterest';
const { scrape: downloaderPinterest, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderPinterest };
if (require.main === module) cli();
