#!/usr/bin/env node
'use strict';

/**
 * Name : AI Speech-to-Text Transcribe
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Transcribe spoken audio and video files into accurate text with timestamps, segment breakdown, and multi-language support.
 * Note : node scrapers/kyio/ai/scrape-transcribe.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/transcribe';
const { scrape: aiTranscribe, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {},
    lang: {},
    diarization: {}
  }
});

module.exports = { aiTranscribe };
if (require.main === module) cli();
