#!/usr/bin/env node
'use strict';

/**
 * Name : MAC Address Generator
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Generate random valid MAC Address.
 * Note : node scrapers/kyio/tools/scrape-mac-generator.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/mac-generator';
const { scrape: toolsMacGenerator, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { toolsMacGenerator };
if (require.main === module) cli();
