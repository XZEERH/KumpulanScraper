#!/usr/bin/env node
'use strict';

/**
 * Name : YTDL
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Advanced YouTube downloader providing multiple media formats in a single request.
 * Note : node scrapers/kyio/downloader/scrape-ytdl.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ytdl';
const { scrape: downloaderYtdl, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderYtdl };
if (require.main === module) cli();
