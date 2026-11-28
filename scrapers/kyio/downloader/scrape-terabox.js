#!/usr/bin/env node
'use strict';

/**
 * Name : TeraBox Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download files from TeraBox. Returns direct download and streaming links.
 * Note : node scrapers/kyio/downloader/scrape-terabox.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/terabox';
const { scrape: downloaderTerabox, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    q: {}
  }
});

module.exports = { downloaderTerabox };
if (require.main === module) cli();
