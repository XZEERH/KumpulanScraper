#!/usr/bin/env node
'use strict';

/**
 * Name : DeepChat Universal AI Gateway
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Gerbang AI universal multi-provider: gpt-4.1, claude-opus-4-7, gemini-2.5-pro, deepseek-r1, kimi-k3, grok-4, mistral-large, flux-2-pro.
 * Note : node scrapers/kyio/ai/scrape-deepchat.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/deepchat';
const { scrape: aiDeepchat, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    model: {}
  }
});

module.exports = { aiDeepchat };
if (require.main === module) cli();
