#!/usr/bin/env node
'use strict';

/**
 * Name : Ondoku TTS
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Premium AI Text-to-Speech via Ondoku. Supports Indonesian local dialects (Javanese, Sundanese).
 * Note : node scrapers/kyio/text-to-speech/scrape-ondoku.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/ondoku';
const { scrape: textToSpeechOndoku, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    voice: { required: true },
    speed: { required: true },
    pitch: { required: true }
  }
});

module.exports = { textToSpeechOndoku };
if (require.main === module) cli();
