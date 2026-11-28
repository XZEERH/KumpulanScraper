#!/usr/bin/env node
'use strict';

/**
 * Name : Who Am I
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Returns your complete public IP intelligence including ISP, organization, ASN, location, coordinates, timezone, and security status.
 * Note : node scrapers/kyio/tools/scrape-myip.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/myip';
const { scrape: toolsMyip, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET']
});

module.exports = { toolsMyip };
if (require.main === module) cli();
