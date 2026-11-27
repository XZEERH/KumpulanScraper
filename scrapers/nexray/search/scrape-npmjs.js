#!/usr/bin/env node
'use strict';

/**
 * Name : NPM-Package
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mencari package di npm registry
 * Note : node scrapers/nexray/search/scrape-npmjs.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/npmjs';
const { scrape: nexraySearchNpmjs, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchNpmjs };
if (require.main === module) cli();
