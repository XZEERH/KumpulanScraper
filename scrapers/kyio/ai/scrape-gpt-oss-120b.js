#!/usr/bin/env node
'use strict';

/**
 * Name : GPT-OSS 120B AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : OpenAI gpt-oss 120B open-weights reasoning model served privately through Duck.ai Tinfoil.
 * Note : node scrapers/kyio/ai/scrape-gpt-oss-120b.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/gpt-oss-120b';
const { scrape: aiGptOss120b, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiGptOss120b };
if (require.main === module) cli();
