#!/usr/bin/env node
'use strict';

/**
 * Name : Claude Opus 4.7
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Model teratas Anthropic Claude Opus 4.7 untuk reasoning mendalam, analisis kompleks, dan coding.
 * Note : node scrapers/kyio/ai/scrape-claude-opus-4-7.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/claude-opus-4-7';
const { scrape: aiClaudeOpus47, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiClaudeOpus47 };
if (require.main === module) cli();
