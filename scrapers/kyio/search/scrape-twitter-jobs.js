#!/usr/bin/env node
'use strict';

/**
 * Name : X/Twitter Jobs Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for job postings across X/Twitter.
 * Note : node scrapers/kyio/search/scrape-twitter-jobs.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/twitter-jobs';
const { scrape: searchTwitterJobs, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchTwitterJobs };
if (require.main === module) cli();
