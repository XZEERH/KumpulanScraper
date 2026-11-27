#!/usr/bin/env node
'use strict';

/**
 * Name : Qwen 3.6
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : The latest Qwen 3.6 model with vision capabilities. Analyze images and chat with high efficiency.
 * Note : node scrapers/kyio/ai/scrape-qwen-36.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/qwen-36';
const { scrape: aiQwen36, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    url: { required: true }
  }
});

module.exports = { aiQwen36 };
if (require.main === module) cli();
