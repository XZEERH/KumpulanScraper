#!/usr/bin/env node
'use strict';

/**
 * Name : SoundCloud Downloader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Download high-quality MP3 tracks from soundcloud.com.
 * Note : node scrapers/kyio/downloader/scrape-soundcloud.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/soundcloud';
const { scrape: downloaderSoundcloud, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true }
  }
});

module.exports = { downloaderSoundcloud };
if (require.main === module) cli();
