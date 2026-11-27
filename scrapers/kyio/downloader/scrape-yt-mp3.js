#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube MP3 Downloader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fast and reliable converter to extract audio from YouTube videos in MP3 format.
 * Note : node scrapers/kyio/downloader/scrape-yt-mp3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/dl/yt-mp3';
const { scrape: downloaderYtMp3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: {},
    id: {}
  }
});

module.exports = { downloaderYtMp3 };
if (require.main === module) cli();
