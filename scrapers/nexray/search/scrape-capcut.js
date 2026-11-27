#!/usr/bin/env node
'use strict';

/**
 * Name : CapCut
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : CapCut Search
 * Note : node scrapers/nexray/search/scrape-capcut.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/capcut';
const { scrape: nexraySearchCapcut, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchCapcut };
if (require.main === module) cli();
