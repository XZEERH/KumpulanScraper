#!/usr/bin/env node
'use strict';

/**
 * Name : Prompt Optimizer
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Perluas, pertajam, dan perjelas prompt sederhana menjadi prompt komprehensif berkualitas tinggi.
 * Note : node scrapers/kyio/ai/scrape-prompt-optimizer.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/prompt-optimizer';
const { scrape: aiPromptOptimizer, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    context: {}
  }
});

module.exports = { aiPromptOptimizer };
if (require.main === module) cli();
