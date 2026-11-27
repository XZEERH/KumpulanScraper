#!/usr/bin/env node
'use strict';

/**
 * Name : Alight Motion: Verify Magic Link
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Verifikasi tautan magic link Alight Creative untuk mengaktifkan lisensi 1 Tahun Alight Motion Premium secara instan.
 * Note : node scrapers/kyio/tools/scrape-amprem-verify.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/amprem-verify';
const { scrape: toolsAmpremVerify, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    email: { required: true },
    link: { required: true }
  }
});

module.exports = { toolsAmpremVerify };
if (require.main === module) cli();
