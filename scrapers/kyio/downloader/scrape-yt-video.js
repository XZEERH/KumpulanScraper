#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Video Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Professional-grade YouTube video downloader with HD quality support.
 * Note : node scrapers/kyio/downloader/scrape-yt-video.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/yt-video';
const { scrape: downloaderYtVideo, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderYtVideo };
if (require.main === module) cli();
