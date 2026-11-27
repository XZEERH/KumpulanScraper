#!/usr/bin/env node
'use strict';

/**
 * Name : Nano-Banana Image to Image
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Alternative Nano-Banana engine (imgupscaler) for high-quality image modifications (supports URL or direct upload).
 * Access : Kyio Premium
 * Note : node scrapers/kyio/image/scrape-nano-banana-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/nano-banana-v2';
const { scrape: imageNanoBananaV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    prompt: { required: true },
    url: {},
    file: {}
  }
});

module.exports = { imageNanoBananaV2 };
if (require.main === module) cli();
