#!/usr/bin/env node
'use strict';

/**
 * Name : AIO Downloader V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-speed Universal Downloader for TikTok, IG, YT, FB, dll.
 * Note : node scrapers/kyio/downloader/scrape-aio-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/aio-v2';
const { scrape: downloaderAioV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    q: { required: true }
  }
});

module.exports = { downloaderAioV2 };
if (require.main === module) cli();
