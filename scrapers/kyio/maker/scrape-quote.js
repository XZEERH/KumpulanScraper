#!/usr/bin/env node
'use strict';

/**
 * Name : Aesthetic Quote Maker
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate beautiful aesthetic quote images. Support [highlight] using brackets.
 * Note : node scrapers/kyio/maker/scrape-quote.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/maker/quote';
const { scrape: makerQuote, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    author: { required: true }
  }
});

module.exports = { makerQuote };
if (require.main === module) cli();
