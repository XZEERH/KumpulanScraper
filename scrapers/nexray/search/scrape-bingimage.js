#!/usr/bin/env node
'use strict';

/**
 * Name : Bing Image
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search for images using Bing image search
 * Note : node scrapers/nexray/search/scrape-bingimage.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/bingimage';
const { scrape: nexraySearchBingimage, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchBingimage };
if (require.main === module) cli();
