#!/usr/bin/env node
'use strict';

/**
 * Name : Claude
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan Claude AI
 * Note : node scrapers/nexray/ai/scrape-claude.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/claude';
const { scrape: nexrayAiClaude, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiClaude };
if (require.main === module) cli();
