#!/usr/bin/env node
'use strict';

/**
 * Name : DeepSeek V4 Flash
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Ultra-fast AI model with basic reasoning capabilities and high efficiency.
 * Note : node scrapers/kyio/ai/scrape-deepseek-v4-flash.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/deepseek-v4-flash';
const { scrape: aiDeepseekV4Flash, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiDeepseekV4Flash };
if (require.main === module) cli();
