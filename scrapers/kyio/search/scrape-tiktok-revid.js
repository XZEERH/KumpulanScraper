#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok AI Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search TikTok videos with semantic AI relevance rankings via revid.ai.
 * Note : node scrapers/kyio/search/scrape-tiktok-revid.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/tiktok-revid';
const { scrape: searchTiktokRevid, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    sort: {}
  }
});

module.exports = { searchTiktokRevid };
if (require.main === module) cli();
