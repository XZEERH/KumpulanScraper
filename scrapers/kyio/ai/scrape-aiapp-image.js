#!/usr/bin/env node
'use strict';

/**
 * Name : AIApp Image Generator
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Endpoint primer AI Image Generator (image, logo, tattoo, signature) via api.aiapp.ai.
 * Note : node scrapers/kyio/ai/scrape-aiapp-image.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/aiapp-image';
const { scrape: aiAiappImage, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true, aliases: ['prompt', 'text'] },
    model: {},
    aspectRatio: {}
  }
});

module.exports = { aiAiappImage };
if (require.main === module) cli();
