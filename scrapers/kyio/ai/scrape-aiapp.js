#!/usr/bin/env node
'use strict';

/**
 * Name : AIApp Chat (Primary)
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Endpoint primer AI Chat via api.aiapp.ai dengan dukungan multi-model, sesi multi-turn, dan web search.
 * Note : node scrapers/kyio/ai/scrape-aiapp.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/aiapp';
const { scrape: aiAiapp, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true, aliases: ['prompt', 'text', 'query', 'message'] },
    model: {},
    sessionId: {},
    webSearch: {}
  }
});

module.exports = { aiAiapp };
if (require.main === module) cli();
