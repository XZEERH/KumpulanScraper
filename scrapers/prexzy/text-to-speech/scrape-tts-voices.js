#!/usr/bin/env node
'use strict';

/**
 * Name : All TTS Voices
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Get list of all 30 available TTS voices
 * Note : node scrapers/prexzy/text-to-speech/scrape-tts-voices.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/tts/tts-voices';
const { scrape: prexzyTextToSpeechTtsVoices, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy'
});

module.exports = { prexzyTextToSpeechTtsVoices };
if (require.main === module) cli();
