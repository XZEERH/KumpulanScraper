#!/usr/bin/env node
'use strict';

/**
 * Name : KBBI
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search word meaning in KBBI.
 * Note : node scrapers/kyio/search/scrape-kbbi.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/kbbi';
const { scrape: searchKbbi, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchKbbi };
if (require.main === module) cli();
