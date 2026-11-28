#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Stalk V3
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch Instagram profile information and current stories.
 * Note : node scrapers/kyio/information/scrape-igstalk-v3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/igstalk-v3';
const { scrape: informationIgstalkV3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    username: { required: true }
  }
});

module.exports = { informationIgstalkV3 };
if (require.main === module) cli();
