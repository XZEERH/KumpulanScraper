#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Earnings
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/tools
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get TikTok user earnings and analytics data
 * Note : node scrapers/nexray/tools/scrape-tiktokearnings.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/tools/tiktokearnings';
const { scrape: nexrayToolsTiktokearnings, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    username: { required: true }
  }
});

module.exports = { nexrayToolsTiktokearnings };
if (require.main === module) cli();
