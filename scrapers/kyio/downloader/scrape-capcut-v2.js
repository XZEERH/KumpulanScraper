#!/usr/bin/env node
'use strict';

/**
 * Name : CapCut Downloader V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download CapCut videos and templates without watermark.
 * Note : node scrapers/kyio/downloader/scrape-capcut-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/dl/capcut-v2';
const { scrape: downloaderCapcutV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderCapcutV2 };
if (require.main === module) cli();
