#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Downloader V5
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Advanced TikTok downloader with no watermark, HD video support, and full statistics.
 * Note : node scrapers/kyio/downloader/scrape-tiktok-v5.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tiktok-v5';
const { scrape: downloaderTiktokV5, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderTiktokV5 };
if (require.main === module) cli();
