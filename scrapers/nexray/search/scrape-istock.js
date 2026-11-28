#!/usr/bin/env node
'use strict';

/**
 * Name : iStock
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search for images on iStock
 * Note : node scrapers/nexray/search/scrape-istock.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/istock';
const { scrape: nexraySearchIstock, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchIstock };
if (require.main === module) cli();
