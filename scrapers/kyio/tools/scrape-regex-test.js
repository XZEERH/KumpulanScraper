#!/usr/bin/env node
'use strict';

/**
 * Name : Regex Tester
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Menguji pola regex terhadap teks dan menampilkan semua match, grup, dan posisinya.
 * Note : node scrapers/kyio/tools/scrape-regex-test.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/regex-test';
const { scrape: toolsRegexTest, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    pattern: { required: true },
    text: { required: true }
  }
});

module.exports = { toolsRegexTest };
if (require.main === module) cli();
