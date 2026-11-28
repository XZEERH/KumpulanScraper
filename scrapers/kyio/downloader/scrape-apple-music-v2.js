#!/usr/bin/env node
'use strict';

/**
 * Name : Apple Music Downloader v2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download high-quality mp3 and covers from Apple Music via AplMate.
 * Note : node scrapers/kyio/downloader/scrape-apple-music-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/apple-music-v2';
const { scrape: downloaderAppleMusicV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderAppleMusicV2 };
if (require.main === module) cli();
