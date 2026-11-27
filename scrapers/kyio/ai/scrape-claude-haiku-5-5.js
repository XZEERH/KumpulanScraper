#!/usr/bin/env node
'use strict';

/**
 * Name : Claude Haiku 5.5 AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Anthropic Claude Haiku 5.5 high-speed lightweight conversational and code reasoning model melalui Duck.ai.
 * Note : node scrapers/kyio/ai/scrape-claude-haiku-5-5.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/claude-haiku-5-5';
const { scrape: aiClaudeHaiku55, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiClaudeHaiku55 };
if (require.main === module) cli();
