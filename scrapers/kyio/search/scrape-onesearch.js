#!/usr/bin/env node
'use strict';

/**
 * Name : OneSearch Deep Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Pencarian profil mendalam tokoh publik, karir, dan tautan referensi berbasis Begamob ChatAI.
 * Note : node scrapers/kyio/search/scrape-onesearch.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/onesearch';
const { scrape: searchOnesearch, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    q: { required: true },
    limit: {}
  }
});

module.exports = { searchOnesearch };
if (require.main === module) cli();
