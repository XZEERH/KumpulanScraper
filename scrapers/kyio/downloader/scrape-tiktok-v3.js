#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Downloader V3
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Alternative high-speed TikTok downloader with full media support and statistics.
 * Note : node scrapers/kyio/downloader/scrape-tiktok-v3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tiktok-v3';
const { scrape: downloaderTiktokV3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderTiktokV3 };
if (require.main === module) cli();
