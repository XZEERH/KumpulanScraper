#!/usr/bin/env node
'use strict';

/**
 * Name : KlikXXI Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for any movie or TV series on KlikXXI and get results with details.
 * Note : node scrapers/kyio/search/scrape-klikxxi.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/klikxxi';
const { scrape: searchKlikxxi, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    action: { required: true }
  }
});

module.exports = { searchKlikxxi };
if (require.main === module) cli();
