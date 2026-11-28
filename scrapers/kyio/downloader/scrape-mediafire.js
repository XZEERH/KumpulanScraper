#!/usr/bin/env node
'use strict';

/**
 * Name : Mediafire Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Extract metadata and direct download links from Mediafire.
 * Note : node scrapers/kyio/downloader/scrape-mediafire.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/mediafire';
const { scrape: downloaderMediafire, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderMediafire };
if (require.main === module) cli();
