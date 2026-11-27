#!/usr/bin/env node
'use strict';

/**
 * Name : Threads Downloader v2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download photos, carousels, and videos from Threads posts via threadsdl.app engine.
 * Note : node scrapers/kyio/downloader/scrape-threads-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/threads-v2';
const { scrape: downloaderThreadsV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderThreadsV2 };
if (require.main === module) cli();
