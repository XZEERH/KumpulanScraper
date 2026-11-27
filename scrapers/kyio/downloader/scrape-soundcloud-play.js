#!/usr/bin/env node
'use strict';

/**
 * Name : SoundCloud Play
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search and stream/download SoundCloud tracks directly by title.
 * Note : node scrapers/kyio/downloader/scrape-soundcloud-play.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/downloader/soundcloud-play';
const { scrape: downloaderSoundcloudPlay, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { downloaderSoundcloudPlay };
if (require.main === module) cli();
