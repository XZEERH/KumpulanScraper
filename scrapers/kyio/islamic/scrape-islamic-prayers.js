#!/usr/bin/env node
'use strict';

/**
 * Name : Islamic Prayers
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Dapatkan doa harian Islam (Random, Search, List).
 * Note : node scrapers/kyio/islamic/scrape-islamic-prayers.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/islamic-prayers';
const { scrape: islamicIslamicPrayers, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    type: { required: true },
    query: {},
    id: {}
  }
});

module.exports = { islamicIslamicPrayers };
if (require.main === module) cli();
