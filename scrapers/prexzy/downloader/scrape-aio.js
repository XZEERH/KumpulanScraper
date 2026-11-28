#!/usr/bin/env node
'use strict';

/**
 * Name : AIo Downloader
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : All In One social media downloader - get video and audio in multiple qualities from YouTube, TikTok, Facebook and more
 * Note : node scrapers/prexzy/downloader/scrape-aio.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/download/aio';
const { scrape: prexzyDownloaderAio, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  field: 'data',
  params: {
    url: { required: true, url: true }
  }
});

module.exports = { prexzyDownloaderAio };
if (require.main === module) cli();
