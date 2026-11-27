#!/usr/bin/env node
'use strict';

/**
 * Name : Wikipedia Search V2
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Pencarian Wikipedia tingkat lanjut (mendukung full infobox, struktur section, dan gambar).
 * Note : node scrapers/kyio/search/scrape-wikipedia-v2.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/wikipedia-v2';
const { scrape: searchWikipediaV2, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    limit: {},
    detail: {},
    related: {}
  }
});

module.exports = { searchWikipediaV2 };
if (require.main === module) cli();
