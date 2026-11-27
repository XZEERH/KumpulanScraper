#!/usr/bin/env node
'use strict';

/**
 * Name : LINE Webtoon Scraper
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search Webtoons, read descriptions, get daily schedules, and fetch episode lists.
 * Note : node scrapers/kyio/search/scrape-webtoons.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/webtoons';
const { scrape: searchWebtoons, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    url: {},
    day: {}
  }
});

module.exports = { searchWebtoons };
if (require.main === module) cli();
