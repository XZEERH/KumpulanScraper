#!/usr/bin/env node
'use strict';

/**
 * Name : Open Trivia Quiz
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get random trivia questions across various categories and difficulties.
 * Note : node scrapers/kyio/fun/scrape-trivia.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/fun/trivia';
const { scrape: funTrivia, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    amount: { required: true },
    difficulty: { required: true },
    category: { required: true }
  }
});

module.exports = { funTrivia };
if (require.main === module) cli();
