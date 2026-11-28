#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Story Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download Instagram stories, profile picture, highlights, and posts without login.
 * Note : node scrapers/kyio/downloader/scrape-igstory.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/igstory';
const { scrape: downloaderIgstory, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderIgstory };
if (require.main === module) cli();
