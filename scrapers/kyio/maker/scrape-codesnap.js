#!/usr/bin/env node
'use strict';

/**
 * Name : CodeSnap Maker
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate beautiful code screenshots from raw source code
 * Note : node scrapers/kyio/maker/scrape-codesnap.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/codesnap';
const { scrape: makerCodesnap, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    code: { required: true },
    q: {}
  }
});

module.exports = { makerCodesnap };
if (require.main === module) cli();
