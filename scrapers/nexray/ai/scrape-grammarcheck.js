#!/usr/bin/env node
'use strict';

/**
 * Name : Grammar Check
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Check and correct grammar
 * Note : node scrapers/nexray/ai/scrape-grammarcheck.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/grammarcheck';
const { scrape: nexrayAiGrammarcheck, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiGrammarcheck };
if (require.main === module) cli();
