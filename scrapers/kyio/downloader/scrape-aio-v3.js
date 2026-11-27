#!/usr/bin/env node
'use strict';

/**
 * Name : AIO Downloader V3
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Universal Downloader based on getindevice.com
 * Note : node scrapers/kyio/downloader/scrape-aio-v3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/aio-v3';
const { scrape: downloaderAioV3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    q: { required: true }
  }
});

module.exports = { downloaderAioV3 };
if (require.main === module) cli();
