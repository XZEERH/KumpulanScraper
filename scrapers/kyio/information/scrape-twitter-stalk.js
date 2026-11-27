#!/usr/bin/env node
'use strict';

/**
 * Name : Twitter Stalk
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch detailed profile information of an X/Twitter user.
 * Note : node scrapers/kyio/information/scrape-twitter-stalk.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/twitter-stalk';
const { scrape: informationTwitterStalk, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    username: { required: true }
  }
});

module.exports = { informationTwitterStalk };
if (require.main === module) cli();
