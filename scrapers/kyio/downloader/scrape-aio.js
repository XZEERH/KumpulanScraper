#!/usr/bin/env node
'use strict';

/**
 * Name : AIO Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Universal Downloader
 * Note : node scrapers/kyio/downloader/scrape-aio.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/aio';
const { scrape: downloaderAio, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    q: { required: true }
  }
});

module.exports = { downloaderAio };
if (require.main === module) cli();
