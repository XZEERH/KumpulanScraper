#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube MP3 Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fast direct YouTube MP3 audio extractor supporting bare IDs and short links.
 * Note : node scrapers/kyio/downloader/scrape-ytmp3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ytmp3';
const { scrape: downloaderYtmp3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: {},
    id: {},
    q: {}
  }
});

module.exports = { downloaderYtmp3 };
if (require.main === module) cli();
