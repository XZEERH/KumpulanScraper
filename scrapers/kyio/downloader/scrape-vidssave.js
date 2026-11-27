#!/usr/bin/env node
'use strict';

/**
 * Name : Vidssave Multi-Platform Downloader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download Instagram carousels/reels, TikTok, Twitter, and YouTube media via vidssave engine.
 * Note : node scrapers/kyio/downloader/scrape-vidssave.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/vidssave';
const { scrape: downloaderVidssave, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderVidssave };
if (require.main === module) cli();
