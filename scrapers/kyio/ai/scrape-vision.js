#!/usr/bin/env node
'use strict';

/**
 * Name : GPT Vision AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Analyze and ask questions about any image using advanced Vision AI (Mendukung URL atau Unggah File).
 * Note : node scrapers/kyio/ai/scrape-vision.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/vision';
const { scrape: aiVision, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {},
    prompt: { required: true },
    web_access: {}
  }
});

module.exports = { aiVision };
if (require.main === module) cli();
