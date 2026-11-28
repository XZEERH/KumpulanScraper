#!/usr/bin/env node
'use strict';

/**
 * Name : Gemini TTS
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Google Gemini Text to Speech converter.
 * Note : node scrapers/kyio/ai/scrape-gemini-tts.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gemini-tts';
const { scrape: aiGeminiTts, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiGeminiTts };
if (require.main === module) cli();
