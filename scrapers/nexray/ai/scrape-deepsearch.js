#!/usr/bin/env node
'use strict';

/**
 * Name : DeepSearch
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Deep search with AI research assistant
 * Note : node scrapers/nexray/ai/scrape-deepsearch.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/deepsearch';
const { scrape: nexrayAiDeepsearch, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiDeepsearch };
if (require.main === module) cli();
