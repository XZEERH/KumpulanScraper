#!/usr/bin/env node
'use strict';

/**
 * Name : JSON Placeholder
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fake Online REST API for testing and prototyping. Access Posts, Users, and more with mock data.
 * Note : node scrapers/kyio/information/scrape-placeholder.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/placeholder';
const { scrape: informationPlaceholder, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    resource: { required: true },
    id: { required: true }
  }
});

module.exports = { informationPlaceholder };
if (require.main === module) cli();
