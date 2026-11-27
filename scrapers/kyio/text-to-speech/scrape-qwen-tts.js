#!/usr/bin/env node
'use strict';

/**
 * Name : Qwen TTS
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-quality AI Text-to-Speech via Qwen. Provides natural-sounding voices.
 * Note : node scrapers/kyio/text-to-speech/scrape-qwen-tts.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/qwen-tts';
const { scrape: textToSpeechQwenTts, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    voice: { required: true }
  }
});

module.exports = { textToSpeechQwenTts };
if (require.main === module) cli();
