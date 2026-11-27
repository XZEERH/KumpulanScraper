#!/usr/bin/env node
'use strict';

/**
 * Name : Tokopedia Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for products on Tokopedia using GraphQL API.
 * Note : node scrapers/kyio/search/scrape-tokopedia.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/tokopedia';
const { scrape: searchTokopedia, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchTokopedia };
if (require.main === module) cli();
