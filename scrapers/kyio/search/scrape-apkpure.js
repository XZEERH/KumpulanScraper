#!/usr/bin/env node
'use strict';

/**
 * Name : APKPure Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Search and get direct download links for Android APKs from APKPure.
 * Note : node scrapers/kyio/search/scrape-apkpure.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/apkpure';
const { scrape: searchApkpure, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchApkpure };
if (require.main === module) cli();
