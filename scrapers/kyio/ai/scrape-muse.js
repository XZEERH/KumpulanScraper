#!/usr/bin/env node
'use strict';

/**
 * Name : Muse AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Muse AI creative and high-speed conversational model.
 * Note : node scrapers/kyio/ai/scrape-muse.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/muse';
const { scrape: aiMuse, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    system: {}
  }
});

module.exports = { aiMuse };
if (require.main === module) cli();
