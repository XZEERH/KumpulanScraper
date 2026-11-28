#!/usr/bin/env node
'use strict';

/**
 * Name : 8 Font
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Search for fonts on 8font
 * Note : node scrapers/nexray/search/scrape-8font.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/8font';
const { scrape: nexraySearch8font, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true },
    page: {}
  }
});

module.exports = { nexraySearch8font };
if (require.main === module) cli();
