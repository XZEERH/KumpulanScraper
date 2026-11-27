#!/usr/bin/env node
'use strict';

/**
 * Name : DeepSeek R1 Reasoning
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Model penalaran matematika, logika, dan pemrograman tingkat lanjut DeepSeek R1.
 * Note : node scrapers/kyio/ai/scrape-deepseek-r1.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/deepseek-r1';
const { scrape: aiDeepseekR1, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiDeepseekR1 };
if (require.main === module) cli();
