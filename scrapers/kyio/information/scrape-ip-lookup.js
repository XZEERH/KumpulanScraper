#!/usr/bin/env node
'use strict';

/**
 * Name : IP Lookup V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch detailed information about an IP address including location, ISP, and proxy status.
 * Note : node scrapers/kyio/information/scrape-ip-lookup.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/ip-lookup';
const { scrape: informationIpLookup, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    ip: { required: true }
  }
});

module.exports = { informationIpLookup };
if (require.main === module) cli();
