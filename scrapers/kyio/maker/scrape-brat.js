#!/usr/bin/env node
'use strict';

/**
 * Name : Brat Generator
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate authentic Brat album cover (white aesthetic) powered by @ghuts/brat and Sharp.
 * Note : node scrapers/kyio/maker/scrape-brat.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/brat';
const { scrape: makerBrat, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    text: { required: true },
    blur: {},
    size: {},
    format: {}
  }
});

module.exports = { makerBrat };
if (require.main === module) cli();
