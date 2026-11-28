#!/usr/bin/env node
'use strict';

/**
 * Name : NIK Parser
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Parse Indonesian NIK (KTP) number to extract province, city, district, gender, and birth date.
 * Note : node scrapers/kyio/tools/scrape-nikparser.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/nikparser';
const { scrape: toolsNikparser, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    nik: { required: true }
  }
});

module.exports = { toolsNikparser };
if (require.main === module) cli();
