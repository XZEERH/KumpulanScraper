#!/usr/bin/env node
'use strict';

/**
 * Name : Al-Quran
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Dapatkan daftar surah, detail surah, atau ayat Al-Quran.
 * Note : node scrapers/kyio/islamic/scrape-al-quran.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/al-quran';
const { scrape: islamicAlQuran, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    action: {},
    surah: {},
    ayah: {},
    query: {}
  }
});

module.exports = { islamicAlQuran };
if (require.main === module) cli();
