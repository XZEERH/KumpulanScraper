#!/usr/bin/env node
'use strict';

/**
 * Name : Hacker News
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch the top stories from Hacker News (news.ycombinator.com)
 * Note : node scrapers/kyio/news/scrape-hackernews.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/news/hackernews';
const { scrape: newsHackernews, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsHackernews };
if (require.main === module) cli();
