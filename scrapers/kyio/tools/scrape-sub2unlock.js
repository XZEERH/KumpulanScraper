#!/usr/bin/env node
'use strict';

/**
 * Name : Sub2Unlock Shortlink Generator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Create subscribe-to-unlock link locks with task verification via sub2unlocksl.com.
 * Note : node scrapers/kyio/tools/scrape-sub2unlock.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/sub2unlock';
const { scrape: toolsSub2unlock, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    lock_url: { required: true },
    destination_url: { required: true }
  }
});

module.exports = { toolsSub2unlock };
if (require.main === module) cli();
