#!/usr/bin/env node
'use strict';

/**
 * Name : Atria AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Next-generation 512k context AI intelligence assistant with instant SSE streaming, conversational accuracy, and multi-model resilience fallback.
 * Note : node scrapers/kyio/ai/scrape-atria.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/atria';
const { scrape: aiAtria, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    model: {},
    system: {},
    stream: {},
    temperature: {},
    max_tokens: {}
  }
});

module.exports = { aiAtria };
if (require.main === module) cli();
