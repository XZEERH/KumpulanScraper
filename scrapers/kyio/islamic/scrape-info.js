#!/usr/bin/env node
'use strict';

/**
 * Name : Islamic Info
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Dapatkan data Asmaul Husna, Ayat Kursi, atau Niat Sholat dari database lokal.
 * Note : node scrapers/kyio/islamic/scrape-info.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/islamic/info';
const { scrape: islamicInfo, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    type: { required: true }
  }
});

module.exports = { islamicInfo };
if (require.main === module) cli();
