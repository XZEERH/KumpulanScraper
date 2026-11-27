#!/usr/bin/env node
'use strict';

/**
 * Name : Threads Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download photos and videos from Threads posts using threadsmate.com engine.
 * Note : node scrapers/kyio/downloader/scrape-threads.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/threads';
const { scrape: downloaderThreads, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    q: { required: true }
  }
});

module.exports = { downloaderThreads };
if (require.main === module) cli();
