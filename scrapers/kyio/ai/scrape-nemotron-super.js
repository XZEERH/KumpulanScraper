#!/usr/bin/env node
'use strict';

/**
 * Name : NVIDIA Nemotron 3 Super 120B
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : High-intelligence 120B parameter reasoning and conversation model by NVIDIA.
 * Note : node scrapers/kyio/ai/scrape-nemotron-super.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/nemotron-super';
const { scrape: aiNemotronSuper, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true }
  }
});

module.exports = { aiNemotronSuper };
if (require.main === module) cli();
