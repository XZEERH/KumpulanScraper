#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Downloader V3
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-speed YouTube downloader using Downr API. Supports various qualities and formats.
 * Note : node scrapers/kyio/downloader/scrape-ytdl-v3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ytdl-v3';
const { scrape: downloaderYtdlV3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderYtdlV3 };
if (require.main === module) cli();
