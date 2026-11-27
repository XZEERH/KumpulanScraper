#!/usr/bin/env node
'use strict';

/**
 * Name : Alight Motion Premium
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Layanan aktivasi Alight Motion Premium 1 Tahun resmi melalui Cloud Functions Alight Creative & Google Identity Toolkit.
 * Note : node scrapers/kyio/tools/scrape-amprem.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/amprem';
const { scrape: toolsAmprem, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: {},
    email: {},
    link: {}
  }
});

module.exports = { toolsAmprem };
if (require.main === module) cli();
