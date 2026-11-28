#!/usr/bin/env node
'use strict';

/**
 * Name : NVIDIA Vision AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : NVIDIA Ising Calibration 1.5 vision model. Supports text and image analysis via the NVIDIA API catalog.
 * Note : node scrapers/kyio/ai/scrape-nvidia-vision.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/nvidia-vision';
const { scrape: aiNvidiaVision, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    model: {},
    image: {}
  }
});

module.exports = { aiNvidiaVision };
if (require.main === module) cli();
