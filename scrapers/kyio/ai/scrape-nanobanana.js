#!/usr/bin/env node
'use strict';

/**
 * Name : Nano Banana AI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Universal AI Image Generator & Editor powered by Nano Banana Neural Engine.
 * Note : node scrapers/kyio/ai/scrape-nanobanana.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/nanobanana';
const { scrape: aiNanobanana, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    prompt: { required: true },
    aspect_ratio: {},
    resolution: {},
    image: {}
  }
});

module.exports = { aiNanobanana };
if (require.main === module) cli();
