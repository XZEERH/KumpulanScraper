#!/usr/bin/env node
'use strict';

/**
 * Name : Natalie
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat with Natalie AI
 * Note : node scrapers/nexray/ai/scrape-natalie.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/Natalie';
const { scrape: nexrayAiNatalie, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiNatalie };
if (require.main === module) cli();
