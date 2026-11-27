#!/usr/bin/env node
'use strict';

/**
 * Name : Lyrics Search V3
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari lirik via judul/query atau URL (genius/spotify), tanpa track ID. Multi-provider dengan fallback.
 * Note : node scrapers/kyio/search/scrape-lyrics-v3.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/lyrics-v3';
const { scrape: searchLyricsV3, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchLyricsV3 };
if (require.main === module) cli();
