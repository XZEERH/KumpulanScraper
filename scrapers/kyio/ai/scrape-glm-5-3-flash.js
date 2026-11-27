#!/usr/bin/env node
'use strict';

/**
 * Name : GLM 5.3 Flash AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : GLM 5.3 Flash high-throughput reasoning conversational model.
 * Note : node scrapers/kyio/ai/scrape-glm-5-3-flash.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/glm-5-3-flash';
const { scrape: aiGlm53Flash, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiGlm53Flash };
if (require.main === module) cli();
