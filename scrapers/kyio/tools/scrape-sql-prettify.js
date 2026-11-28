#!/usr/bin/env node
'use strict';

/**
 * Name : SQL Prettify
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Merapikan format query SQL.
 * Note : node scrapers/kyio/tools/scrape-sql-prettify.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/sql-prettify';
const { scrape: toolsSqlPrettify, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['POST'],
  params: {
    sql: { required: true }
  }
});

module.exports = { toolsSqlPrettify };
if (require.main === module) cli();
