#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Downloader v7
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download TikTok videos without watermark, direct audio, and full photo slide sets via viesnap.
 * Note : node scrapers/kyio/downloader/scrape-tiktok-v7.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/tiktok-v7';
const { scrape: downloaderTiktokV7, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderTiktokV7 };
if (require.main === module) cli();
