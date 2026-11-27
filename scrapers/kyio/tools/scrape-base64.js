#!/usr/bin/env node
'use strict';

/**
 * Name : Base64 Converter
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Encode atau Decode teks ke Base64 (action=encode/decode).
 * Note : node scrapers/kyio/tools/scrape-base64.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/base64';
const { scrape: toolsBase64, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: { required: true },
    text: { required: true }
  }
});

module.exports = { toolsBase64 };
if (require.main === module) cli();
