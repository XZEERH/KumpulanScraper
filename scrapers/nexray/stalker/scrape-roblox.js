#!/usr/bin/env node
'use strict';

/**
 * Name : Roblox
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/stalker
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get complete Roblox user information
 * Note : node scrapers/nexray/stalker/scrape-roblox.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/stalker/roblox';
const { scrape: nexrayStalkerRoblox, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    username: { required: true }
  }
});

module.exports = { nexrayStalkerRoblox };
if (require.main === module) cli();
