#!/usr/bin/env node
'use strict';

/**
 * Name : Google Gemini 2.5 Pro
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Model flagship reasoning dan multimodal dari Google DeepMind Gemini 2.5 Pro.
 * Note : node scrapers/kyio/ai/scrape-gemini-2-5-pro.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gemini-2-5-pro';
const { scrape: aiGemini25Pro, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiGemini25Pro };
if (require.main === module) cli();
