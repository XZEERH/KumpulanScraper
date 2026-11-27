#!/usr/bin/env node
'use strict';

/**
 * Name : YouTube Transcript
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch subtitle / transcript text from YouTube video.
 * Note : node scrapers/kyio/tools/scrape-transcript.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/transcript';
const { scrape: toolsTranscript, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true }
  }
});

module.exports = { toolsTranscript };
if (require.main === module) cli();
