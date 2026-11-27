#!/usr/bin/env node
'use strict';

/**
 * Name : Alight Motion Bulk Auto Verify
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Pembuat dan aktivasi akun Alight Motion Pro 1 Tahun otomatis berkecepatan tinggi dengan integrasi temporary mailbox dan autentikasi instan.
 * Note : node scrapers/kyio/tools/scrape-amprembulk.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/amprembulk';
const { scrape: toolsAmprembulk, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: {},
    count: {},
    email: {},
    link: {}
  }
});

module.exports = { toolsAmprembulk };
if (require.main === module) cli();
