#!/usr/bin/env node
'use strict';

/**
 * Name : Facebook Downloader V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Alternative Facebook downloader using ruhend-scraper.
 * Note : node scrapers/kyio/downloader/scrape-fb-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/fb-v2';
const { scrape: downloaderFbV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderFbV2 };
if (require.main === module) cli();
