#!/usr/bin/env node
'use strict';

/**
 * Name : AI Content Detector
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Detect whether a text is written by an AI or a human.
 * Note : node scrapers/kyio/tools/scrape-ai-detector.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/ai-detector';
const { scrape: toolsAiDetector, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    text: { required: true }
  }
});

module.exports = { toolsAiDetector };
if (require.main === module) cli();
