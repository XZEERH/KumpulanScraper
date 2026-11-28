#!/usr/bin/env node
'use strict';

/**
 * Name : Epsilon
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Academic paper search with Epsilon AI
 * Note : node scrapers/nexray/ai/scrape-epsilon.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/epsilon';
const { scrape: nexrayAiEpsilon, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiEpsilon };
if (require.main === module) cli();
