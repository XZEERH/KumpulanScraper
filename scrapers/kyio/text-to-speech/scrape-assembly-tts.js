#!/usr/bin/env node
'use strict';

/**
 * Name : AssemblyAI Text-to-Speech
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Text-to-Speech natural berlatensi rendah dengan 34 suara (EN, ES, DE, IT, FR, PT) & dukungan voice cloning.
 * Note : node scrapers/kyio/text-to-speech/scrape-assembly-tts.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/assembly-tts';
const { scrape: textToSpeechAssemblyTts, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true, aliases: ['text', 'prompt', 'input'] },
    voice: {},
    format: {},
    json: {}
  }
});

module.exports = { textToSpeechAssemblyTts };
if (require.main === module) cli();
