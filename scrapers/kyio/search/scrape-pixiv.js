#!/usr/bin/env node
'use strict';

/**
 * Name : Pixiv Search
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch high-quality anime-style images from Pixiv database (Priority Access)
 * Note : node scrapers/kyio/search/scrape-pixiv.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/pixiv';
const { scrape: searchPixiv, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true },
    r18: { required: true }
  }
});

module.exports = { searchPixiv };
if (require.main === module) cli();
