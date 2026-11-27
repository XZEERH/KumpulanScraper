#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Play MP3
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fast response YouTube Music Search & Play with direct high-speed audio stream.
 * Note : node scrapers/kyio/downloader/scrape-yt-play.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/dl/yt-play';
const { scrape: downloaderYtPlay, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderYtPlay };
if (require.main === module) cli();
