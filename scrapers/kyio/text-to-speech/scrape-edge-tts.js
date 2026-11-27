#!/usr/bin/env node
'use strict';

/**
 * Name : Edge TTS
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-quality Text-to-Speech using Microsoft Edge engine.
 * Note : node scrapers/kyio/text-to-speech/scrape-edge-tts.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/edge-tts';
const { scrape: textToSpeechEdgeTts, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    voice: { required: true },
    lang: { required: true }
  }
});

module.exports = { textToSpeechEdgeTts };
if (require.main === module) cli();
