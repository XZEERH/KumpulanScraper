#!/usr/bin/env node
'use strict';

/**
 * Name : Music Search & Download
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search and download tracks from high-fidelity audio sources including Spotify and Soundcloud.
 * Note : node scrapers/kyio/downloader/scrape-spotify-sc.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/dl/spotify-sc';
const { scrape: downloaderSpotifySc, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderSpotifySc };
if (require.main === module) cli();
