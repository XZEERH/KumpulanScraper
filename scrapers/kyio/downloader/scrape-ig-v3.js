#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Downloader V3
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-speed Instagram Reels, Posts, Photos & Carousel Downloader via Clipssaver Engine.
 * Note : node scrapers/kyio/downloader/scrape-ig-v3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/ig-v3';
const { scrape: downloaderIgV3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderIgV3 };
if (require.main === module) cli();
