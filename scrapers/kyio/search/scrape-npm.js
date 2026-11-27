#!/usr/bin/env node
'use strict';

/**
 * Name : NPM Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search for packages on NPM Registry.
 * Note : node scrapers/kyio/search/scrape-npm.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/npm';
const { scrape: searchNpm, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchNpm };
if (require.main === module) cli();
