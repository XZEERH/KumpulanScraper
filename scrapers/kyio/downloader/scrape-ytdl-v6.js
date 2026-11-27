#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Downloader V6
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Alternative YouTube Downloader engine.
 * Note : node scrapers/kyio/downloader/scrape-ytdl-v6.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/ytdl-v6';
const { scrape: downloaderYtdlV6, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderYtdlV6 };
if (require.main === module) cli();
