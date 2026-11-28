#!/usr/bin/env node
'use strict';

/**
 * Name : Jeeves
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan Jeeves AI
 * Note : node scrapers/nexray/ai/scrape-jeeves.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/jeeves';
const { scrape: nexrayAiJeeves, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiJeeves };
if (require.main === module) cli();
