#!/usr/bin/env node
'use strict';

/**
 * Name : DuckAI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Multi-model AI gateway powered by Duck.ai supporting GPT-6 Luna, GPT-5.6 Terra and Sol, GPT-5.4 Mini, Claude Sonnet 5.5, Claude Haiku 5.5, Claude Opus 5.5, Mistral Small 4, GPT-OSS 120B, and Gemma 4 31B.
 * Note : node scrapers/kyio/ai/scrape-duckai.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/duckai';
const { scrape: aiDuckai, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    model: {},
    system: {}
  }
});

module.exports = { aiDuckai };
if (require.main === module) cli();
