#!/usr/bin/env node
'use strict';

/**
 * Name : JS Obfuscator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Obfuscate and protect your JavaScript source code
 * Note : node scrapers/kyio/tools/scrape-encrypt.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/encrypt';
const { scrape: toolsEncrypt, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  params: {
    code: { required: true }
  }
});

module.exports = { toolsEncrypt };
if (require.main === module) cli();
