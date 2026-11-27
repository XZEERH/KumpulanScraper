#!/usr/bin/env node
'use strict';

/**
 * Name : UUID v4 Generator
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate Random UUID (Universally Unique Identifier) versi 4.
 * Note : node scrapers/kyio/tools/scrape-uuid.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/uuid';
const { scrape: toolsUuid, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    count: {}
  }
});

module.exports = { toolsUuid };
if (require.main === module) cli();
