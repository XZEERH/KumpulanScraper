#!/usr/bin/env node
'use strict';

/**
 * Name : Sticker.ly Search
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Cari sticker pack dari Sticker.ly
 * Note : node scrapers/kyio/search/scrape-stickerly.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/search/stickerly';
const { scrape: searchStickerly, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { searchStickerly };
if (require.main === module) cli();
