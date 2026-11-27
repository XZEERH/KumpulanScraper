#!/usr/bin/env node
'use strict';

/**
 * Name : CHAT AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : AI chat system powered by CHAT GPT
 * Note : node scrapers/kyio/ai/scrape-ch-at.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/ch-at';
const { scrape: aiChAt, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiChAt };
if (require.main === module) cli();
