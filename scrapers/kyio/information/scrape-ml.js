#!/usr/bin/env node
'use strict';

/**
 * Name : MLBB Stalker V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cek nickname akun ML berdasarkan ID dan Server
 * Note : node scrapers/kyio/information/scrape-ml.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/stalk/ml';
const { scrape: informationMl, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    id: { required: true },
    server: { required: true }
  }
});

module.exports = { informationMl };
if (require.main === module) cli();
