#!/usr/bin/env node
'use strict';

/**
 * Name : Roman Numeral Converter
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Ubah angka bulat menjadi angka Romawi.
 * Note : node scrapers/kyio/tools/scrape-roman.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/roman';
const { scrape: toolsRoman, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    number: { required: true }
  }
});

module.exports = { toolsRoman };
if (require.main === module) cli();
