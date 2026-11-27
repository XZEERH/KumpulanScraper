#!/usr/bin/env node
'use strict';

/**
 * Name : Twitter/X Downloader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download videos and images from Twitter/X (formerly Twitter) with high-speed processing and direct links.
 * Note : node scrapers/kyio/downloader/scrape-twitter.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/twitter';
const { scrape: downloaderTwitter, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    q: { required: true }
  }
});

module.exports = { downloaderTwitter };
if (require.main === module) cli();
