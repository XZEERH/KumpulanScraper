#!/usr/bin/env node
'use strict';

/**
 * Name : Monica
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan Monica AI
 * Note : node scrapers/nexray/ai/scrape-monica.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/monica';
const { scrape: nexrayAiMonica, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiMonica };
if (require.main === module) cli();
