#!/usr/bin/env node
'use strict';

/**
 * Name : Bilibili
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search videos on Bilibili
 * Note : node scrapers/nexray/search/scrape-bilibili.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/bilibili';
const { scrape: nexraySearchBilibili, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchBilibili };
if (require.main === module) cli();
