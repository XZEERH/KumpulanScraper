#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal Sholat
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Dapatkan jadwal sholat harian untuk kota-kota di Indonesia.
 * Note : node scrapers/kyio/islamic/scrape-jadwal-sholat.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/islamic/jadwal-sholat';
const { scrape: islamicJadwalSholat, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { islamicJadwalSholat };
if (require.main === module) cli();
