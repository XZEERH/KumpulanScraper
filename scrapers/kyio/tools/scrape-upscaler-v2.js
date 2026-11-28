#!/usr/bin/env node
'use strict';

/**
 * Name : AI Image Upscaler V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Tingkatkan resolusi gambar hingga 2x HD menggunakan Real-ESRGAN super-resolution model.
 * Note : node scrapers/kyio/tools/scrape-upscaler-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/upscaler-v2';
const { scrape: toolsUpscalerV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {},
    model: {},
    json: {}
  }
});

module.exports = { toolsUpscalerV2 };
if (require.main === module) cli();
