#!/usr/bin/env node
'use strict';

/**
 * Name : Muslim AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Islamic AI. Answers questions based on Quran and Islamic teachings.
 * Note : node scrapers/kyio/ai/scrape-muslimai.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/muslimai';
const { scrape: aiMuslimai, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiMuslimai };
if (require.main === module) cli();
