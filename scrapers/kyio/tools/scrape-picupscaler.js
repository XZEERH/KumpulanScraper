#!/usr/bin/env node
'use strict';

/**
 * Name : AI PicUpscaler
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Enhance and upscale image resolution to 2x HD with crystal clarity and no watermark.
 * Note : node scrapers/kyio/tools/scrape-picupscaler.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/picupscaler';
const { scrape: toolsPicupscaler, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {}
  }
});

module.exports = { toolsPicupscaler };
if (require.main === module) cli();
