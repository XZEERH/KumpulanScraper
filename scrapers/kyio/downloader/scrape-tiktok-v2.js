#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Downloader V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Advanced TikTok downloader with video, audio, and image support (No Watermark).
 * Note : node scrapers/kyio/downloader/scrape-tiktok-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tiktok-v2';
const { scrape: downloaderTiktokV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderTiktokV2 };
if (require.main === module) cli();
