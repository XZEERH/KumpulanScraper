#!/usr/bin/env node
'use strict';

/**
 * Name : TalkAI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : AI Companion Beebop from TalkAI.
 * Note : node scrapers/kyio/ai/scrape-talkai.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/talkai';
const { scrape: aiTalkai, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiTalkai };
if (require.main === module) cli();
