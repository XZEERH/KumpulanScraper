#!/usr/bin/env node
'use strict';

/**
 * Name : Qwen 2.5 Coder 32B AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Specialized coding foundation model by Alibaba Cloud for programming, debugging, and software architecture.
 * Note : node scrapers/kyio/ai/scrape-qwen-2-5-coder.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/qwen-2-5-coder';
const { scrape: aiQwen25Coder, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiQwen25Coder };
if (require.main === module) cli();
