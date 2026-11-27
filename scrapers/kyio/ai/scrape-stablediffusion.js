#!/usr/bin/env node
'use strict';

/**
 * Name : Stable Diffusion Generator
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate high-resolution AI artwork using Stable Diffusion models.
 * Note : node scrapers/kyio/ai/scrape-stablediffusion.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/stablediffusion';
const { scrape: aiStablediffusion, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    prompt: { required: true },
    model: {},
    negative_prompt: {},
    guidance: {},
    json: {}
  }
});

module.exports = { aiStablediffusion };
if (require.main === module) cli();
