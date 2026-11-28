#!/usr/bin/env node
'use strict';

/**
 * Name : Job Finder
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari lowongan kerja aktif dan terverifikasi dari Glints Indonesia.
 * Note : node scrapers/kyio/search/scrape-loker.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/loker';
const { scrape: searchLoker, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchLoker };
if (require.main === module) cli();
