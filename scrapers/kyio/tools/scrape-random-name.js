#!/usr/bin/env node
'use strict';

/**
 * Name : Random Name Generator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate random names powered by BehindTheName.
 * Note : node scrapers/kyio/tools/scrape-random-name.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/random-name';
const { scrape: toolsRandomName, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    gender: {},
    number: {},
    country: {}
  }
});

module.exports = { toolsRandomName };
if (require.main === module) cli();
