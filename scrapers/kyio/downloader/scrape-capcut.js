#!/usr/bin/env node
'use strict';

/**
 * Name : CapCut Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download CapCut video templates without watermark.
 * Note : node scrapers/kyio/downloader/scrape-capcut.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/dl/capcut';
const { scrape: downloaderCapcut, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderCapcut };
if (require.main === module) cli();
