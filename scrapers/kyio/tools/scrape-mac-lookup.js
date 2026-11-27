#!/usr/bin/env node
'use strict';

/**
 * Name : MAC Address Lookup
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari nama vendor / pabrikan dari MAC Address perangkat.
 * Note : node scrapers/kyio/tools/scrape-mac-lookup.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/mac-lookup';
const { scrape: toolsMacLookup, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    mac: { required: true }
  }
});

module.exports = { toolsMacLookup };
if (require.main === module) cli();
