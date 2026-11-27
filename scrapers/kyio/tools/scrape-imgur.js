#!/usr/bin/env node
'use strict';

/**
 * Name : Imgur Uploader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Upload images to Imgur storage service via direct file upload.
 * Note : node scrapers/kyio/tools/scrape-imgur.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/imgur';
const { scrape: toolsImgur, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    file: { required: true }
  }
});

module.exports = { toolsImgur };
if (require.main === module) cli();
