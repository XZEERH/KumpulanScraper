#!/usr/bin/env node
'use strict';

/**
 * Name : Audio Effect Converter
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Transform MP3 audio with bass boost, nightcore, slowed reverb, 3D audio, vocal enhancement and more.
 * Note : node scrapers/kyio/tools/scrape-audio-converter.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/audio-converter';
const { scrape: toolsAudioConverter, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    effect: {},
    file: {}
  }
});

module.exports = { toolsAudioConverter };
if (require.main === module) cli();
