#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Downloader V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download videos, photo slides, or reels from Instagram with multi-slide support.
 * Note : node scrapers/kyio/downloader/scrape-ig-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ig-v2';
const { scrape: downloaderIgV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderIgV2 };
if (require.main === module) cli();
