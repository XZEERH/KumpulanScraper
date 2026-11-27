#!/usr/bin/env node
'use strict';

/**
 * Name : Roblox User Stalk
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Get comprehensive details about any Roblox user including stats, badges, and games.
 * Note : node scrapers/kyio/tools/scrape-roblox.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/roblox';
const { scrape: toolsRoblox, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET'],
  params: {
    q: { required: true }
  }
});

module.exports = { toolsRoblox };
if (require.main === module) cli();
