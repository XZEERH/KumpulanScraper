#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Downloader V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Improved YouTube downloader. Supports YouTube Shorts and MP4 Video only.
 * Note : node scrapers/kyio/downloader/scrape-ytdl-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ytdl-v2';
const { scrape: downloaderYtdlV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderYtdlV2 };
if (require.main === module) cli();
