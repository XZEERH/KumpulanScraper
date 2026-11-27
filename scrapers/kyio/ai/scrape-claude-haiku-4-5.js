#!/usr/bin/env node
'use strict';

/**
 * Name : Claude Haiku 4.5 AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Anthropic Claude Haiku 4.5 ultra-fast lightweight conversational and reasoning model.
 * Note : node scrapers/kyio/ai/scrape-claude-haiku-4-5.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/claude-haiku-4-5';
const { scrape: aiClaudeHaiku45, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiClaudeHaiku45 };
if (require.main === module) cli();
