#!/usr/bin/env node
'use strict';

/**
 * Name : KBBI V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Official KBBI scraper using yux-api.
 * Note : node scrapers/kyio/search/scrape-kbbi-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/kbbi-v2';
const { scrape: searchKbbiV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchKbbiV2 };
if (require.main === module) cli();
