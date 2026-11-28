#!/usr/bin/env node
'use strict';

/**
 * Name : MLBB Stalker
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Check Mobile Legends nickname and region by User ID and Zone ID.
 * Note : node scrapers/kyio/information/scrape-mlbbstalk.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/mlbbstalk';
const { scrape: informationMlbbstalk, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    userId: { required: true },
    zoneId: { required: true }
  }
});

module.exports = { informationMlbbstalk };
if (require.main === module) cli();
