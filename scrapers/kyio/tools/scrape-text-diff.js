#!/usr/bin/env node
'use strict';

/**
 * Name : Text Diff Checker
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Membandingkan dua teks dan menampilkan baris/kata yang ditambah, dihapus, dan tetap.
 * Note : node scrapers/kyio/tools/scrape-text-diff.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/text-diff';
const { scrape: toolsTextDiff, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    original: { required: true },
    changed: { required: true }
  }
});

module.exports = { toolsTextDiff };
if (require.main === module) cli();
