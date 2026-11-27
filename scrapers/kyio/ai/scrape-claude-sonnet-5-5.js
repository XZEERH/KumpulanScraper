#!/usr/bin/env node
'use strict';

/**
 * Name : Claude Sonnet 5.5 AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Anthropic Claude Sonnet 5.5 balanced premium reasoning and coding model melalui Duck.ai.
 * Note : node scrapers/kyio/ai/scrape-claude-sonnet-5-5.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/claude-sonnet-5-5';
const { scrape: aiClaudeSonnet55, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiClaudeSonnet55 };
if (require.main === module) cli();
