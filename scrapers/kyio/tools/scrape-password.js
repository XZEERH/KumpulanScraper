#!/usr/bin/env node
'use strict';

/**
 * Name : Password Strength Analyzer
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Menganalisis seberapa kuat kata sandi Anda.
 * Note : node scrapers/kyio/tools/scrape-password.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/password';
const { scrape: toolsPassword, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    text: { required: true }
  }
});

module.exports = { toolsPassword };
if (require.main === module) cli();
