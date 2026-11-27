#!/usr/bin/env node
'use strict';

/**
 * Name : Magic Studio AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate stunning AI art with Magic Studio.
 * Note : node scrapers/kyio/ai/scrape-magic-studio.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/magic-studio';
const { scrape: aiMagicStudio, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    prompt: { required: true }
  }
});

module.exports = { aiMagicStudio };
if (require.main === module) cli();
