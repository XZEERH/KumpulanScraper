#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest Lens
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Temukan pin dan gambar serupa berdasarkan URL pin, Pin ID, atau link gambar visual.
 * Note : node scrapers/kyio/search/scrape-pinterest-lens.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/pinterest-lens';
const { scrape: searchPinterestLens, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    limit: {}
  }
});

module.exports = { searchPinterestLens };
if (require.main === module) cli();
