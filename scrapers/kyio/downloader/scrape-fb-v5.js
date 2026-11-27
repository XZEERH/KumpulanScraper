#!/usr/bin/env node
'use strict';

/**
 * Name : Facebook Downloader v5
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download Facebook Reels and Videos in HD/SD and extract MP3 audio via fget.io.
 * Note : node scrapers/kyio/downloader/scrape-fb-v5.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/fb-v5';
const { scrape: downloaderFbV5, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderFbV5 };
if (require.main === module) cli();
