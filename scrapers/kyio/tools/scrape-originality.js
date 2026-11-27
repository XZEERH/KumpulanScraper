#!/usr/bin/env node
'use strict';

/**
 * Name : Originality.ai Scanner
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Check AI Detection, Plagiarism, and Grammar using Originality.ai free tools.
 * Note : node scrapers/kyio/tools/scrape-originality.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/originality';
const { scrape: toolsOriginality, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    mode: {}
  }
});

module.exports = { toolsOriginality };
if (require.main === module) cli();
