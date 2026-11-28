#!/usr/bin/env node
'use strict';

/**
 * Name : Melolo Drama Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Mencari dan mengambil data drama dari Melolo (Fantasy Short Drama).
 * Note : node scrapers/kyio/search/scrape-melolo.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/melolo';
const { scrape: searchMelolo, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    q: {}
  }
});

module.exports = { searchMelolo };
if (require.main === module) cli();
