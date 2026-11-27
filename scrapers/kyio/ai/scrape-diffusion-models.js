#!/usr/bin/env node
'use strict';

/**
 * Name : Diffusion Models Directory
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Daftar model AI Diffusion yang tersedia untuk text2image dan image2image.
 * Note : node scrapers/kyio/ai/scrape-diffusion-models.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/diffusion-models';
const { scrape: aiDiffusionModels, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    type: {}
  }
});

module.exports = { aiDiffusionModels };
if (require.main === module) cli();
