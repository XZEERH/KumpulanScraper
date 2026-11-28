#!/usr/bin/env node
'use strict';

/**
 * Name : NVIDIA AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : NVIDIA Nemotron models (3.5 Lightning 30B, Ising Calibration 31B, Ultra 550B). Supports reasoning/thinking mode.
 * Note : node scrapers/kyio/ai/scrape-nvidia.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/nvidia';
const { scrape: aiNvidia, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    model: {},
    thinking: {}
  }
});

module.exports = { aiNvidia };
if (require.main === module) cli();
