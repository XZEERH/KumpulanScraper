#!/usr/bin/env node
'use strict';

/**
 * Name : Kisah Nabi
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Dapatkan sejarah dan kisah 25 Nabi Islam.
 * Note : node scrapers/kyio/islamic/scrape-kisah-nabi.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/islamic/kisah-nabi';
const { scrape: islamicKisahNabi, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { islamicKisahNabi };
if (require.main === module) cli();
