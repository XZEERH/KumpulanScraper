#!/usr/bin/env node
'use strict';

/**
 * Name : IP Lookup
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Look up geolocation info for an IP address.
 * Note : node scrapers/kyio/information/scrape-iplookup.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/iplookup';
const { scrape: informationIplookup, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    ip: { required: true }
  }
});

module.exports = { informationIplookup };
if (require.main === module) cli();
