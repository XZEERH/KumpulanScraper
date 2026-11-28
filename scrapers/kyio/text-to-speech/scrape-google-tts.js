#!/usr/bin/env node
'use strict';

/**
 * Name : Google TTS
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Reliable Text-to-Speech using the Google Translate engine.
 * Note : node scrapers/kyio/text-to-speech/scrape-google-tts.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/google-tts';
const { scrape: textToSpeechGoogleTts, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    lang: { required: true }
  }
});

module.exports = { textToSpeechGoogleTts };
if (require.main === module) cli();
