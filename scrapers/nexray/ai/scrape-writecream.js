#!/usr/bin/env node
'use strict';

/**
 * Name : Write Cream
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan Write Creame AI.
 * Note : node scrapers/nexray/ai/scrape-writecream.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/writecream';
const { scrape: nexrayAiWritecream, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true },
    logic: { required: true }
  }
});

module.exports = { nexrayAiWritecream };
if (require.main === module) cli();
