#!/usr/bin/env node
'use strict';

/**
 * Name : Lirik Lagu Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari lirik lagu dan kredit lengkap dari LirikLagu. Mendukung pencarian judul dan URL lirik langsung.
 * Note : node scrapers/kyio/search/scrape-liriklagu.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/liriklagu';
const { scrape: searchLiriklagu, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    url: {}
  }
});

module.exports = { searchLiriklagu };
if (require.main === module) cli();
