#!/usr/bin/env node
'use strict';

/**
 * Name : Sfile Uploader
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Upload files directly to sfile.co.
 * Note : node scrapers/kyio/tools/scrape-sfile.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/sfile';
const { scrape: toolsSfile, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  fileParam: 'file',
  params: {
    file: { required: true },
    description: {}
  }
});

module.exports = { toolsSfile };
if (require.main === module) cli();
