#!/usr/bin/env node
'use strict';

/**
 * Name : Facebook Downloader V4
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-speed Facebook video downloader supporting SD and HD quality.
 * Note : node scrapers/kyio/downloader/scrape-fb-v4.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/fb-v4';
const { scrape: downloaderFbV4, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderFbV4 };
if (require.main === module) cli();
