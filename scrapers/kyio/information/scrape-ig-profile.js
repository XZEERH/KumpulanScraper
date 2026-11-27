#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram User Profile
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Access comprehensive public profile data from any Instagram user.
 * Note : node scrapers/kyio/information/scrape-ig-profile.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/ig-profile';
const { scrape: informationIgProfile, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    username: { required: true }
  }
});

module.exports = { informationIgProfile };
if (require.main === module) cli();
