#!/usr/bin/env node
'use strict';

/**
 * Name : Deep Image AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-quality AI image generation via Deep-Image.ai.
 * Note : node scrapers/kyio/ai/scrape-deep-image.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/deep-image';
const { scrape: aiDeepImage, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    prompt: { required: true }
  }
});

module.exports = { aiDeepImage };
if (require.main === module) cli();
