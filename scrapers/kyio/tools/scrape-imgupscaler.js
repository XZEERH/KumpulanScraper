#!/usr/bin/env node
'use strict';

/**
 * Name : AI Image Upscaler
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Enhance and upscale photos to 2x or 4x high resolution using AI via imgupscaler.com.
 * Note : node scrapers/kyio/tools/scrape-imgupscaler.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/imgupscaler';
const { scrape: toolsImgupscaler, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    scale: {},
    file: {}
  }
});

module.exports = { toolsImgupscaler };
if (require.main === module) cli();
