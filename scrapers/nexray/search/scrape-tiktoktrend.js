#!/usr/bin/env node
'use strict';

/**
 * Name : TikTok Trending
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mendapatkan feed trending TikTok berdasarkan region
 * Note : node scrapers/nexray/search/scrape-tiktoktrend.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/tiktoktrend';
const { scrape: nexraySearchTiktoktrend, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    id: { required: true }
  }
});

module.exports = { nexraySearchTiktoktrend };
if (require.main === module) cli();
