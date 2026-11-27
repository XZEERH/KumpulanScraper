#!/usr/bin/env node
'use strict';

/**
 * Name : JagatPlay Latest News
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get the latest game news articles directly from JagatPlay.
 * Note : node scrapers/kyio/news/scrape-jagatplay.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/jagatplay';
const { scrape: newsJagatplay, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { newsJagatplay };
if (require.main === module) cli();
