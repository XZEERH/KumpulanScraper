#!/usr/bin/env node
'use strict';

/**
 * Name : Twitter/X Downloader V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Enhanced Twitter/X downloader using tweeterdownloader.com. Supports high-quality video extraction and multiple qualities.
 * Note : node scrapers/kyio/downloader/scrape-twitter-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/twitter-v2';
const { scrape: downloaderTwitterV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderTwitterV2 };
if (require.main === module) cli();
