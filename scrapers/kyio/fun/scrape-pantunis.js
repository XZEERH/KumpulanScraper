#!/usr/bin/env node
'use strict';

/**
 * Name : Pantunis Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari pantun berdasarkan kata kunci dari pantunis.com.
 * Note : node scrapers/kyio/fun/scrape-pantunis.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/fun/pantunis';
const { scrape: funPantunis, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { funPantunis };
if (require.main === module) cli();
