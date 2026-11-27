#!/usr/bin/env node
'use strict';

/**
 * Name : Image to Image Diffusion
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Transform and stylize existing images using Stable Diffusion models.
 * Note : node scrapers/kyio/ai/scrape-image2image.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/image2image';
const { scrape: aiImage2image, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    prompt: { required: true },
    url: {},
    file: {},
    strength: {},
    model: {},
    json: {}
  }
});

module.exports = { aiImage2image };
if (require.main === module) cli();
