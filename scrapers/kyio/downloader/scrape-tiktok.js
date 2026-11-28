#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download video TikTok tanpa watermark (HD), slide foto, audio MP3, dan pencarian video TikTok.
 * Note : node scrapers/kyio/downloader/scrape-tiktok.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tiktok';
const { scrape: downloaderTiktok, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: {},
    q: {}
  }
});

module.exports = { downloaderTiktok };
if (require.main === module) cli();
