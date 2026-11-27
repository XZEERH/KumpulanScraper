#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Search V2
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari video TikTok dengan metadata lengkap, ringkasan AI, transkrip, statistik views/likes, dan link unduh video langsung.
 * Note : node scrapers/kyio/search/scrape-tiktok-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/tiktok-v2';
const { scrape: searchTiktokV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    lang: {},
    sort: {}
  }
});

module.exports = { searchTiktokV2 };
if (require.main === module) cli();
