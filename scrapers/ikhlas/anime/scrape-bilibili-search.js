#!/usr/bin/env node
'use strict';

/**
 * Name : Bilibili Searching
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mencari serial anime resmi dan video konten pengguna (UGC) dari platform Bilibili / Bstation lengkap dengan season ID, view count, dan cover.
 * Note : node scrapers/ikhlas/anime/scrape-bilibili-search.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/anime/bilibili-search';
const { scrape: ikhlasAnimeBilibiliSearch, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    query: { required: true }
  }
});

module.exports = { ikhlasAnimeBilibiliSearch };
if (require.main === module) cli();
