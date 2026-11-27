#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Audio Downloader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Professional-grade YouTube to MP3 converter with high-fidelity audio extraction.
 * Note : node scrapers/kyio/downloader/scrape-yt-audio.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/yt-audio';
const { scrape: downloaderYtAudio, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderYtAudio };
if (require.main === module) cli();
