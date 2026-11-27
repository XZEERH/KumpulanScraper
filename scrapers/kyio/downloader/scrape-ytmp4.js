#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube MP4 Downloader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fast direct YouTube MP4 video extractor supporting bare IDs and short links.
 * Note : node scrapers/kyio/downloader/scrape-ytmp4.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ytmp4';
const { scrape: downloaderYtmp4, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: {},
    id: {},
    q: {},
    quality: {}
  }
});

module.exports = { downloaderYtmp4 };
if (require.main === module) cli();
