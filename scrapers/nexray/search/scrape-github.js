#!/usr/bin/env node
'use strict';

/**
 * Name : GitHub
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/search
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Mencari file di GitHub
 * Note : node scrapers/nexray/search/scrape-github.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/search/github';
const { scrape: nexraySearchGithub, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    q: { required: true }
  }
});

module.exports = { nexraySearchGithub };
if (require.main === module) cli();
