#!/usr/bin/env node
'use strict';

/**
 * Name : Generator Email
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Layanan email sementara dari generator.email dengan fitur pembuatan akun acak/custom, penerimaan kotak masuk, ekstraksi otomatis tautan verifikasi dan OTP.
 * Note : node scrapers/kyio/tools/scrape-generator-email.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/generator-email';
const { scrape: toolsGeneratorEmail, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: {},
    email: {},
    id: {},
    user: {},
    domain: {}
  }
});

module.exports = { toolsGeneratorEmail };
if (require.main === module) cli();
