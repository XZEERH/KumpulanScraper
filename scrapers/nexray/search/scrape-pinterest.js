#!/usr/bin/env node
'use strict';

/**
 * Name : Pinterest
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search for images on Pinterest
 * Note : node scrapers/nexray/search/scrape-pinterest.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/pinterest';
const { scrape: nexraySearchPinterest, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchPinterest };
if (require.main === module) cli();
