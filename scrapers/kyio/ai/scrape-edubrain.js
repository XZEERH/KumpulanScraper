#!/usr/bin/env node
'use strict';

/**
 * Name : EduBrain AI Solver
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Educational & Homework Solver AI powered by EduBrain.ai.
 * Note : node scrapers/kyio/ai/scrape-edubrain.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/edubrain';
const { scrape: aiEdubrain, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    subject: {}
  }
});

module.exports = { aiEdubrain };
if (require.main === module) cli();
