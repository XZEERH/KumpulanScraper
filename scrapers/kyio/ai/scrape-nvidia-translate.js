#!/usr/bin/env node
'use strict';

/**
 * Name : NVIDIA Riva Translate
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : NVIDIA Riva Translate 4B. Fast multi-language translation via NVIDIA API catalog.
 * Note : node scrapers/kyio/ai/scrape-nvidia-translate.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/nvidia-translate';
const { scrape: aiNvidiaTranslate, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    to: {}
  }
});

module.exports = { aiNvidiaTranslate };
if (require.main === module) cli();
