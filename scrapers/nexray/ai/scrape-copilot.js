#!/usr/bin/env node
'use strict';

/**
 * Name : Copilot
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Chat dengan Copilot AI
 * Note : node scrapers/nexray/ai/scrape-copilot.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/copilot';
const { scrape: nexrayAiCopilot, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    text: { required: true }
  }
});

module.exports = { nexrayAiCopilot };
if (require.main === module) cli();
