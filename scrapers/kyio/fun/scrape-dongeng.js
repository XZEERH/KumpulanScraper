#!/usr/bin/env node
'use strict';

/**
 * Name : Dongeng Indonesia
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Fetch or search for random Indonesian folktales and children stories
 * Note : node scrapers/kyio/fun/scrape-dongeng.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/fun/dongeng';
const { scrape: funDongeng, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { funDongeng };
if (require.main === module) cli();
