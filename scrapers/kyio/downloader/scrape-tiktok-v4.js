#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Downloader V4
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-fidelity TikTok downloader with HD video support and comprehensive metadata.
 * Note : node scrapers/kyio/downloader/scrape-tiktok-v4.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tiktok-v4';
const { scrape: downloaderTiktokV4, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderTiktokV4 };
if (require.main === module) cli();
