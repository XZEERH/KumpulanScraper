#!/usr/bin/env node
'use strict';

/**
 * Name : Mary
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Convert text to speech using "Mary" voice
 * Note : node scrapers/prexzy/text-to-speech/scrape-tts-mary.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/tts/tts-mary';
const { scrape: prexzyTextToSpeechTtsMary, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  params: {
    text: { required: true },
    pitch: {},
    speed: {}
  }
});

module.exports = { prexzyTextToSpeechTtsMary };
if (require.main === module) cli();
