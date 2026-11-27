#!/usr/bin/env node
'use strict';

/**
 * Name : AI HD Video Enhancer
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Upscale and enhance video clarity to 2K or 1080p using AI video enhancement technology. Author: Hanz.
 * Note : node scrapers/kyio/tools/scrape-hdvideo.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/hdvideo';
const { scrape: toolsHdvideo, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    url: {},
    file: {},
    resolution: {},
    job_id: {},
    async: {}
  }
});

module.exports = { toolsHdvideo };
if (require.main === module) cli();
