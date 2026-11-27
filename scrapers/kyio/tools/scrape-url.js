#!/usr/bin/env node
'use strict';

/**
 * Name : URL Encoder / Decoder
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Encode atau Decode URL (action=encode/decode).
 * Note : node scrapers/kyio/tools/scrape-url.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/url';
const { scrape: toolsUrl, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: { required: true },
    url: { required: true }
  }
});

module.exports = { toolsUrl };
if (require.main === module) cli();
