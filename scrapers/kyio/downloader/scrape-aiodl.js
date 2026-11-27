#!/usr/bin/env node
'use strict';

/**
 * Name : AIO Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : All-in-One Video Downloader. Supports FB, IG, Twitter, TikTok, and YouTube.
 * Note : node scrapers/kyio/downloader/scrape-aiodl.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/aiodl';
const { scrape: downloaderAiodl, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderAiodl };
if (require.main === module) cli();
