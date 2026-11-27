#!/usr/bin/env node
'use strict';

/**
 * Name : Samehadaku Search
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/anime
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search for anime by keyword
 * Note : node scrapers/nexray/anime/scrape-samehadaku-search.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/anime/samehadaku/search';
const { scrape: nexrayAnimeSamehadakuSearch, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexrayAnimeSamehadakuSearch };
if (require.main === module) cli();
