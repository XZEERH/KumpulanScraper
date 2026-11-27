#!/usr/bin/env node
'use strict';

/**
 * Name : GoFile Uploader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Upload files directly to GoFile storage service.
 * Note : node scrapers/kyio/tools/scrape-gofile.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/gofile';
const { scrape: toolsGofile, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    file: { required: true }
  }
});

module.exports = { toolsGofile };
if (require.main === module) cli();
