#!/usr/bin/env node
'use strict';

/**
 * Name : Phone Specs Scraper
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari spesifikasi detail smartphone dari Carisinyal.
 * Note : node scrapers/kyio/information/scrape-spek-hp.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/info/spek-hp';
const { scrape: informationSpekHp, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { informationSpekHp };
if (require.main === module) cli();
