#!/usr/bin/env node
'use strict';

/**
 * Name : Pixiv Search V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Real-time artwork search on pixiv.net.
 * Note : node scrapers/kyio/search/scrape-pixiv-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/pixiv-v2';
const { scrape: searchPixivV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    page: {},
    mode: {}
  }
});

module.exports = { searchPixivV2 };
if (require.main === module) cli();
