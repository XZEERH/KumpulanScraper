#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Downloader V4
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Multi-engine YouTube downloader with comprehensive media info and statistics.
 * Note : node scrapers/kyio/downloader/scrape-ytdl-v4.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ytdl-v4';
const { scrape: downloaderYtdlV4, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderYtdlV4 };
if (require.main === module) cli();
