#!/usr/bin/env node
'use strict';

/**
 * Name : Shopee Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for products on Shopee Indonesia with real-time pricing, ratings, and media.
 * Note : node scrapers/kyio/search/scrape-shopee.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/shopee';
const { scrape: searchShopee, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    limit: {}
  }
});

module.exports = { searchShopee };
if (require.main === module) cli();
