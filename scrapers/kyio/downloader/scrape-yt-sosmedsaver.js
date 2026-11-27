#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Downloader SosmedSaver
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download YouTube MP4 videos directly via SosmedSaver stealth engine.
 * Note : node scrapers/kyio/downloader/scrape-yt-sosmedsaver.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/yt-sosmedsaver';
const { scrape: downloaderYtSosmedsaver, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderYtSosmedsaver };
if (require.main === module) cli();
