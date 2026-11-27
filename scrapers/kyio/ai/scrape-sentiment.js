#!/usr/bin/env node
'use strict';

/**
 * Name : Sentiment Analyzer
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Naive Bayes Sentiment Analyzer (Positive / Negative / Neutral).
 * Note : node scrapers/kyio/ai/scrape-sentiment.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/sentiment';
const { scrape: aiSentiment, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    text: { required: true }
  }
});

module.exports = { aiSentiment };
if (require.main === module) cli();
