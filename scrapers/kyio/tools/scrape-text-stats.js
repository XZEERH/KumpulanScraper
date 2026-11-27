#!/usr/bin/env node
'use strict';

/**
 * Name : Text Statistics
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Menghitung statistik teks (jumlah karakter, kata, baris, byte).
 * Note : node scrapers/kyio/tools/scrape-text-stats.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/text-stats';
const { scrape: toolsTextStats, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    text: { required: true }
  }
});

module.exports = { toolsTextStats };
if (require.main === module) cli();
