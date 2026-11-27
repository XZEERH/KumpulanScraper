#!/usr/bin/env node
'use strict';

/**
 * Name : Text to Image AI
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate high-quality unrestricted AI images from text prompts.
 * Note : node scrapers/kyio/image/scrape-text2img.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/text2img';
const { scrape: imageText2img, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    prompt: { required: true },
    style: {}
  }
});

module.exports = { imageText2img };
if (require.main === module) cli();
