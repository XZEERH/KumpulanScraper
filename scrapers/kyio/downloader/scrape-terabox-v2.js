#!/usr/bin/env node
'use strict';

/**
 * Name : TeraBox Downloader v2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fast TeraBox direct link resolver and media streamer via apiwala engine.
 * Note : node scrapers/kyio/downloader/scrape-terabox-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/terabox-v2';
const { scrape: downloaderTeraboxV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderTeraboxV2 };
if (require.main === module) cli();
