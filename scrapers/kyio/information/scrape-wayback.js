#!/usr/bin/env node
'use strict';

/**
 * Name : Wayback Machine
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Check the Internet Archive for the most recent snapshot of a webpage.
 * Note : node scrapers/kyio/information/scrape-wayback.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/wayback';
const { scrape: informationWayback, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    url: { required: true },
    year: { required: true }
  }
});

module.exports = { informationWayback };
if (require.main === module) cli();
