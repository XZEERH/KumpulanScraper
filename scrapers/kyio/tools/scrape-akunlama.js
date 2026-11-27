#!/usr/bin/env node
'use strict';

/**
 * Name : AkunLama
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Layanan temporary email dari akunlama.com dengan fitur pembuatan akun acak/custom, kotak masuk real-time, dan ekstraksi otomatis OTP serta tautan verifikasi.
 * Note : node scrapers/kyio/tools/scrape-akunlama.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/akunlama';
const { scrape: toolsAkunlama, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: {},
    email: {},
    user: {},
    key: {},
    region: {}
  }
});

module.exports = { toolsAkunlama };
if (require.main === module) cli();
