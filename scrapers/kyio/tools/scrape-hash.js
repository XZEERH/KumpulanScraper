#!/usr/bin/env node
'use strict';

/**
 * Name : Hash Generator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate cryptographic hash (MD5, SHA1, SHA256, dll) dari teks.
 * Note : node scrapers/kyio/tools/scrape-hash.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/hash';
const { scrape: toolsHash, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    text: { required: true },
    algo: {}
  }
});

module.exports = { toolsHash };
if (require.main === module) cli();
