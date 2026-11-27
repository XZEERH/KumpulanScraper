#!/usr/bin/env node
'use strict';

/**
 * Name : Top4top Uploader
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Upload files directly to Top4top.io storage service.
 * Note : node scrapers/kyio/tools/scrape-top4top.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/top4top';
const { scrape: toolsTop4top, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    file: { required: true }
  }
});

module.exports = { toolsTop4top };
if (require.main === module) cli();
