#!/usr/bin/env node
'use strict';

/**
 * Name : Wikipedia
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search for articles on Wikipedia
 * Note : node scrapers/nexray/search/scrape-wikipedia.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/wikipedia';
const { scrape: nexraySearchWikipedia, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchWikipedia };
if (require.main === module) cli();
