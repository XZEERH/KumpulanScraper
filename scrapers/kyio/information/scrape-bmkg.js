#!/usr/bin/env node
'use strict';

/**
 * Name : Earthquake Info
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get the latest earthquake information from BMKG Indonesia.
 * Note : node scrapers/kyio/information/scrape-bmkg.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/bmkg';
const { scrape: informationBmkg, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { informationBmkg };
if (require.main === module) cli();
