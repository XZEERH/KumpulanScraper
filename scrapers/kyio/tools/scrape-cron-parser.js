#!/usr/bin/env node
'use strict';

/**
 * Name : Cron Parser
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Terjemahkan jadwal cron ke teks.
 * Note : node scrapers/kyio/tools/scrape-cron-parser.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/cron-parser';
const { scrape: toolsCronParser, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    cron: { required: true }
  }
});

module.exports = { toolsCronParser };
if (require.main === module) cli();
