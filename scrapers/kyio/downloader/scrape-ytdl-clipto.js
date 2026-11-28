#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Downloader Clipto
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Super-fast YouTube audio/video downloader providing direct googlevideo links via clipto.com.
 * Note : node scrapers/kyio/downloader/scrape-ytdl-clipto.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/ytdl-clipto';
const { scrape: downloaderYtdlClipto, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderYtdlClipto };
if (require.main === module) cli();
