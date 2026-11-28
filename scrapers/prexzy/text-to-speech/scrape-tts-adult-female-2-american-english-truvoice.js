#!/usr/bin/env node
'use strict';

/**
 * Name : Adult Female
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Convert text to speech using "Adult Female #2, American English (TruVoice)" voice
 * Note : node scrapers/prexzy/text-to-speech/scrape-tts-adult-female-2-american-english-truvoice.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/tts/tts-adult-female--2-american-english-truvoice';
const { scrape: prexzyTextToSpeechTtsAdultFemale2AmericanEnglishTruvoice, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    text: { required: true },
    pitch: {},
    speed: {}
  }
});

module.exports = { prexzyTextToSpeechTtsAdultFemale2AmericanEnglishTruvoice };
if (require.main === module) cli();
