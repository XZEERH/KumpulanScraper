#!/usr/bin/env node
'use strict';

/**
 * Name : Samehadaku Page
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/anime
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Get paginated list of all anime
 * Note : node scrapers/nexray/anime/scrape-samehadaku-page.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/anime/samehadaku/page';
const { scrape: nexrayAnimeSamehadakuPage, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    page: {}
  }
});

module.exports = { nexrayAnimeSamehadakuPage };
if (require.main === module) cli();
