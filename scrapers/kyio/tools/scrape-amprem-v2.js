#!/usr/bin/env node
'use strict';

/**
 * Name : Alight Motion Premium V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Layanan pembuat dan aktivasi akun Alight Motion Pro VIP 1 Tahun otomatis, pengirim magic link, verifikator, dan bulk generator.
 * Note : node scrapers/kyio/tools/scrape-amprem-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/amprem-v2';
const { scrape: toolsAmpremV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: {},
    email: {},
    link: {},
    count: {}
  }
});

module.exports = { toolsAmpremV2 };
if (require.main === module) cli();
