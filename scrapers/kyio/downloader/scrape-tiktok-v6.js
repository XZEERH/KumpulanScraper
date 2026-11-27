#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Downloader V6
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download TikTok videos without watermark, audio MP3, and photo slides with high speed.
 * Note : node scrapers/kyio/downloader/scrape-tiktok-v6.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tiktok-v6';
const { scrape: downloaderTiktokV6, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderTiktokV6 };
if (require.main === module) cli();
